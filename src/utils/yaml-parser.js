const yaml = require('js-yaml');
const fs = require('fs-extra');
const chalk = require('chalk');

async function loadYamlFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const docs = yaml.loadAll(content);
    return { content, docs };
  } catch (error) {
    throw new Error(`Erro ao carregar YAML ${filePath}: ${error.message}`);
  }
}

async function saveYamlFile(filePath, docs) {
  try {
    let yamlContent = '';
    
    for (let i = 0; i < docs.length; i++) {
      if (i > 0) {
        yamlContent += '---\n';
      }
      yamlContent += yaml.dump(docs[i], {
        indent: 2,
        lineWidth: 120,
        quotingType: '"',
        forceQuotes: false
      });
    }
    
    await fs.writeFile(filePath, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(`Erro ao salvar YAML ${filePath}: ${error.message}`);
  }
}

function findDeploymentInDocs(docs, deploymentName) {
  return docs.find(doc => 
    doc && 
    doc.kind === 'Deployment' && 
    doc.metadata && 
    doc.metadata.name === deploymentName
  );
}

function updateDeploymentEnvVars(deployment, envVars) {
  if (!deployment.spec.template.spec.containers) {
    throw new Error('Deployment não possui containers especificados');
  }
  
  const container = deployment.spec.template.spec.containers[0];
  
  if (!container.env) {
    container.env = [];
  }
  
  // Remove variáveis OTEL existentes
  container.env = container.env.filter(envVar => 
    !envVar.name.startsWith('OTEL_')
  );
  
  // Adiciona novas variáveis OTEL
  container.env.push(...envVars);
  
  return deployment;
}

function hasOtelConfiguration(deployment) {
  if (!deployment.spec.template.spec.containers) {
    return false;
  }
  
  const container = deployment.spec.template.spec.containers[0];
  
  if (!container.env) {
    return false;
  }
  
  return container.env.some(envVar => envVar.name.startsWith('OTEL_'));
}

function getExistingOtelVars(deployment) {
  if (!deployment.spec.template.spec.containers) {
    return [];
  }
  
  const container = deployment.spec.template.spec.containers[0];
  
  if (!container.env) {
    return [];
  }
  
  return container.env.filter(envVar => envVar.name.startsWith('OTEL_'));
}

function findIngressInDocs(docs, ingressName) {
  return docs.find(doc => 
    doc && 
    doc.kind === 'Ingress' && 
    doc.metadata && 
    doc.metadata.name === ingressName
  );
}

module.exports = {
  loadYamlFile,
  saveYamlFile,
  findDeploymentInDocs,
  findIngressInDocs,
  updateDeploymentEnvVars,
  hasOtelConfiguration,
  getExistingOtelVars
};