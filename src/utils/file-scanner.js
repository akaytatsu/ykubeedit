const { glob } = require('glob');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const chalk = require('chalk');

async function scanYamlFiles(directory) {
  const pattern = path.join(directory, '**/*.{yaml,yml}');
  
  try {
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/.*/**'],
      absolute: true
    });
    
    return files;
  } catch (error) {
    throw new Error(`Erro ao escanear arquivos YAML: ${error.message}`);
  }
}

async function findKubernetesDeployments(yamlFiles) {
  const deployments = [];
  
  for (const filePath of yamlFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const docs = yaml.loadAll(content);
      
      for (const doc of docs) {
        if (doc && 
            doc.kind === 'Deployment' && 
            doc.apiVersion === 'apps/v1' &&
            doc.metadata &&
            doc.spec &&
            doc.spec.template &&
            doc.spec.template.spec &&
            doc.spec.template.spec.containers) {
          
          deployments.push({
            filePath,
            document: doc,
            namespace: doc.metadata.namespace || 'default',
            name: doc.metadata.name,
            appName: doc.metadata.labels?.app || doc.metadata.name,
            containerName: doc.spec.template.spec.containers[0].name
          });
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Aviso: Erro ao processar ${path.relative(process.cwd(), filePath)}: ${error.message}`));
    }
  }
  
  return deployments;
}

async function scanForDeployments(directory) {
  console.log(chalk.blue(`📂 Escaneando arquivos YAML em: ${directory}`));
  
  const yamlFiles = await scanYamlFiles(directory);
  console.log(chalk.gray(`   Encontrados ${yamlFiles.length} arquivos YAML`));
  
  const deployments = await findKubernetesDeployments(yamlFiles);
  console.log(chalk.gray(`   Encontrados ${deployments.length} deployments\n`));
  
  return deployments;
}

module.exports = {
  scanYamlFiles,
  findKubernetesDeployments,
  scanForDeployments
};