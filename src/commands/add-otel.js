const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');

const { scanForDeployments } = require('../utils/file-scanner');
const { 
  loadYamlFile, 
  saveYamlFile, 
  findDeploymentInDocs, 
  updateDeploymentEnvVars,
  hasOtelConfiguration,
  getExistingOtelVars
} = require('../utils/yaml-parser');
const { 
  formatDeploymentInfo, 
  validateDeploymentStructure,
  createDeploymentSummary 
} = require('../utils/deployment-utils');
const { 
  createOtelEnvironmentVariables,
  validateOtelConfiguration 
} = require('../templates/otel-config');

async function execute(directory, options = {}) {
  const spinner = ora('Escaneando deployments...').start();
  
  try {
    // 1. Escanear deployments
    const deployments = await scanForDeployments(directory);
    spinner.stop();
    
    if (deployments.length === 0) {
      console.log(chalk.yellow('❌ Nenhum deployment encontrado no diretório especificado.'));
      return;
    }
    
    // 2. Validar estrutura dos deployments
    const validDeployments = [];
    const invalidDeployments = [];
    
    for (const deployment of deployments) {
      const errors = validateDeploymentStructure(deployment);
      if (errors.length === 0) {
        validDeployments.push(formatDeploymentInfo(deployment));
      } else {
        invalidDeployments.push({ deployment, errors });
      }
    }
    
    if (invalidDeployments.length > 0) {
      console.log(chalk.yellow('\n⚠️  Deployments com problemas de estrutura (ignorados):'));
      invalidDeployments.forEach(({ deployment, errors }) => {
        console.log(chalk.gray(`   ${deployment.name}: ${errors.join(', ')}`));
      });
    }
    
    if (validDeployments.length === 0) {
      console.log(chalk.red('❌ Nenhum deployment válido encontrado.'));
      return;
    }
    
    // 3. Mostrar resumo
    const summary = createDeploymentSummary(validDeployments);
    console.log(chalk.green(`\n📊 Resumo:`));
    console.log(chalk.gray(`   ${summary.total} deployments válidos encontrados`));
    console.log(chalk.gray(`   ${summary.uniqueFiles} arquivos únicos`));
    console.log(chalk.gray(`   Namespaces: ${Object.keys(summary.byNamespace).join(', ')}\n`));
    
    // 4. Analisar configurações OTEL existentes
    const deploymentsWithStatus = validDeployments.map(deployment => {
      const hasOtel = hasOtelConfiguration(deployment.document);
      const existingVars = hasOtel ? getExistingOtelVars(deployment.document) : [];
      const validation = hasOtel ? 
        validateOtelConfiguration(existingVars, deployment.namespace, deployment.name) : 
        null;
      
      return {
        ...deployment,
        hasOtel,
        existingVars,
        validation,
        status: hasOtel ? 
          (validation.isComplete && validation.isCorrectServiceName && validation.isCorrectResourceAttributes ? 
            '✅ OK' : '⚠️  Incompleto') : 
          '❌ Ausente'
      };
    });
    
    // 5. Seleção interativa
    if (!options.selectAll) {
      const choices = deploymentsWithStatus.map(deployment => ({
        name: `${deployment.status} ${deployment.displayName} ${deployment.filePathDisplay}`,
        value: deployment,
        checked: !deployment.hasOtel || (deployment.validation && (!deployment.validation.isComplete || !deployment.validation.isCorrectServiceName || !deployment.validation.isCorrectResourceAttributes))
      }));
      
      const { selectedDeployments } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedDeployments',
          message: 'Selecione os deployments para adicionar/atualizar OpenTelemetry:',
          choices,
          pageSize: 15,
          validate: (answer) => {
            if (answer.length === 0) {
              return 'Você deve selecionar pelo menos um deployment.';
            }
            return true;
          }
        }
      ]);
      
      if (selectedDeployments.length === 0) {
        console.log(chalk.yellow('❌ Nenhum deployment selecionado.'));
        return;
      }
      
      deploymentsWithStatus.splice(0, deploymentsWithStatus.length, ...selectedDeployments);
    }
    
    // 6. Preview das mudanças
    console.log(chalk.blue('\n🔍 Preview das mudanças:\n'));
    
    for (const deployment of deploymentsWithStatus) {
      const otelVars = createOtelEnvironmentVariables(deployment.namespace, deployment.name);
      
      console.log(chalk.cyan(`📄 ${deployment.name} (${deployment.namespace})`));
      console.log(chalk.gray(`   Arquivo: ${deployment.filePathDisplay}`));
      console.log(chalk.gray(`   Subsystem: ${deployment.subsystemName}`));
      
      if (deployment.hasOtel) {
        console.log(chalk.yellow('   📝 Atualizando configuração OTEL existente'));
        if (deployment.validation && !deployment.validation.isCorrectServiceName) {
          console.log(chalk.gray(`   🔧 OTEL_SERVICE_NAME: ${deployment.namespace}`));
        }
        if (deployment.validation && !deployment.validation.isCorrectResourceAttributes) {
          console.log(chalk.gray(`   🔧 OTEL_RESOURCE_ATTRIBUTES: cx.application.name=${deployment.namespace},cx.subsystem.name=${deployment.subsystemName}`));
        }
      } else {
        console.log(chalk.green('   ➕ Adicionando configuração OTEL'));
        console.log(chalk.gray(`   📝 ${otelVars.length} variáveis de ambiente`));
      }
      console.log();
    }
    
    // 7. Confirmação (se não for dry-run)
    if (!options.dryRun) {
      const { confirmApply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmApply',
          message: `Aplicar mudanças em ${deploymentsWithStatus.length} deployment(s)?`,
          default: true
        }
      ]);
      
      if (!confirmApply) {
        console.log(chalk.yellow('❌ Operação cancelada pelo usuário.'));
        return;
      }
    } else {
      console.log(chalk.blue('🔍 Modo preview (--dry-run) - nenhum arquivo será modificado.\n'));
      return;
    }
    
    // 8. Aplicar mudanças
    let processedCount = 0;
    let errorCount = 0;
    
    for (const deployment of deploymentsWithStatus) {
      const deploymentSpinner = ora(`Processando ${deployment.name}...`).start();
      
      try {
        const { docs } = await loadYamlFile(deployment.filePath);
        const deploymentDoc = findDeploymentInDocs(docs, deployment.name);
        
        if (!deploymentDoc) {
          throw new Error(`Deployment ${deployment.name} não encontrado no arquivo`);
        }
        
        const otelVars = createOtelEnvironmentVariables(deployment.namespace, deployment.name);
        updateDeploymentEnvVars(deploymentDoc, otelVars);
        
        await saveYamlFile(deployment.filePath, docs);
        
        deploymentSpinner.succeed(`${deployment.name} atualizado`);
        processedCount++;
        
      } catch (error) {
        deploymentSpinner.fail(`Erro em ${deployment.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // 9. Relatório final
    console.log(chalk.green(`\n🎉 Operação concluída!`));
    console.log(chalk.gray(`   ${processedCount} deployments processados com sucesso`));
    if (errorCount > 0) {
      console.log(chalk.yellow(`   ${errorCount} deployments com erro`));
    }
    console.log();
    
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

module.exports = {
  execute
};