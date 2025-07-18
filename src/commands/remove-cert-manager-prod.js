const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

const { scanForIngress } = require('../utils/file-scanner');
const {
  loadYamlFile,
  saveYamlFile,
  findIngressInDocs
} = require('../utils/yaml-parser');

async function execute(directory, options = {}) {
  const spinner = ora('Escaneando arquivos de ingress...').start();

  try {
    // 1. Escanear arquivos de ingress
    const ingressFiles = await scanForIngress(directory);
    spinner.stop();

    if (ingressFiles.length === 0) {
      console.log(chalk.yellow('❌ Nenhum arquivo de ingress encontrado no diretório especificado.'));
      return;
    }

    // 2. Analisar arquivos para encontrar a tag problemática
    const ingressWithProdTag = [];

    for (const ingressFile of ingressFiles) {
      try {
        const { docs } = await loadYamlFile(ingressFile.filePath);
        
        for (const doc of docs) {
          if (doc && doc.kind === 'Ingress') {
            const annotations = doc.metadata?.annotations;
            if (annotations && annotations['cert-manager.io/cluster-issuer'] === 'letsencrypt-prod') {
              ingressWithProdTag.push({
                ...ingressFile,
                ingressName: doc.metadata.name,
                namespace: doc.metadata.namespace || 'default',
                document: doc
              });
            }
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Erro ao processar ${ingressFile.filePath}: ${error.message}`));
      }
    }

    if (ingressWithProdTag.length === 0) {
      console.log(chalk.green('✅ Nenhum ingress encontrado com a tag cert-manager.io/cluster-issuer: letsencrypt-prod'));
      return;
    }

    // 3. Mostrar resumo
    console.log(chalk.green(`\n📊 Resumo:`));
    console.log(chalk.gray(`   ${ingressWithProdTag.length} ingress(es) encontrado(s) com a tag problemática`));
    console.log(chalk.gray(`   ${new Set(ingressWithProdTag.map(i => i.filePath)).size} arquivo(s) único(s)\n`));

    // 4. Listar ingress encontrados
    console.log(chalk.blue('🔍 Ingress encontrados com cert-manager.io/cluster-issuer: letsencrypt-prod:\n'));
    
    ingressWithProdTag.forEach(ingress => {
      console.log(chalk.cyan(`📄 ${ingress.ingressName} (${ingress.namespace})`));
      console.log(chalk.gray(`   Arquivo: ${path.relative(process.cwd(), ingress.filePath)}`));
      console.log();
    });

    // 5. Seleção interativa (se não for --select-all)
    let selectedIngress = ingressWithProdTag;
    
    if (!options.selectAll) {
      const choices = ingressWithProdTag.map(ingress => ({
        name: `${ingress.ingressName} (${ingress.namespace}) - ${path.relative(process.cwd(), ingress.filePath)}`,
        value: ingress,
        checked: true
      }));

      const { selectedIngressList } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedIngressList',
          message: 'Selecione os ingress para remover a tag cert-manager.io/cluster-issuer: letsencrypt-prod:',
          choices,
          pageSize: 15,
          validate: (answer) => {
            if (answer.length === 0) {
              return 'Você deve selecionar pelo menos um ingress.';
            }
            return true;
          }
        }
      ]);

      if (selectedIngressList.length === 0) {
        console.log(chalk.yellow('❌ Nenhum ingress selecionado.'));
        return;
      }

      selectedIngress = selectedIngressList;
    }

    // 6. Preview das mudanças
    console.log(chalk.blue('\n🔍 Preview das mudanças:\n'));

    for (const ingress of selectedIngress) {
      console.log(chalk.cyan(`📄 ${ingress.ingressName} (${ingress.namespace})`));
      console.log(chalk.gray(`   Arquivo: ${path.relative(process.cwd(), ingress.filePath)}`));
      console.log(chalk.red('   ➖ Removendo: cert-manager.io/cluster-issuer: letsencrypt-prod'));
      console.log();
    }

    // 7. Confirmação (se não for dry-run)
    if (!options.dryRun) {
      const { confirmApply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmApply',
          message: `Remover a tag cert-manager.io/cluster-issuer: letsencrypt-prod de ${selectedIngress.length} ingress(es)?`,
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

    for (const ingress of selectedIngress) {
      const ingressSpinner = ora(`Processando ${ingress.ingressName}...`).start();

      try {
        const { docs } = await loadYamlFile(ingress.filePath);
        
        // Encontrar e atualizar o documento do ingress
        for (const doc of docs) {
          if (doc && 
              doc.kind === 'Ingress' && 
              doc.metadata?.name === ingress.ingressName &&
              doc.metadata?.annotations &&
              doc.metadata.annotations['cert-manager.io/cluster-issuer'] === 'letsencrypt-prod') {
            
            delete doc.metadata.annotations['cert-manager.io/cluster-issuer'];
            
            // Se não há mais annotations, remover o objeto annotations vazio
            if (Object.keys(doc.metadata.annotations).length === 0) {
              delete doc.metadata.annotations;
            }
          }
        }

        await saveYamlFile(ingress.filePath, docs);

        ingressSpinner.succeed(`${ingress.ingressName} atualizado`);
        processedCount++;

      } catch (error) {
        ingressSpinner.fail(`Erro em ${ingress.ingressName}: ${error.message}`);
        errorCount++;
      }
    }

    // 9. Relatório final
    console.log(chalk.green(`\n🎉 Operação concluída!`));
    console.log(chalk.gray(`   ${processedCount} ingress(es) processado(s) com sucesso`));
    if (errorCount > 0) {
      console.log(chalk.yellow(`   ${errorCount} ingress(es) com erro`));
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