const path = require('path');
const chalk = require('chalk');

function extractAppSuffix(deploymentName, namespace) {
  // Remove o namespace do início se presente
  let appName = deploymentName;
  if (appName.startsWith(namespace + '-')) {
    appName = appName.substring(namespace.length + 1);
  }
  
  // Remove prefixos comuns
  const prefixesToRemove = ['vertc-', 'fundos-gestora-'];
  for (const prefix of prefixesToRemove) {
    if (appName.startsWith(prefix)) {
      appName = appName.substring(prefix.length);
      break;
    }
  }
  
  return appName;
}

function generateSubsystemName(namespace, deploymentName) {
  const appSuffix = extractAppSuffix(deploymentName, namespace);
  return `${namespace}-${appSuffix}`;
}

function formatDeploymentInfo(deployment) {
  const filePath = path.relative(process.cwd(), deployment.filePath);
  const subsystemName = generateSubsystemName(deployment.namespace, deployment.name);
  
  return {
    ...deployment,
    displayName: `${chalk.cyan(deployment.namespace)}/${chalk.yellow(deployment.name)}`,
    filePathDisplay: chalk.gray(filePath),
    subsystemName,
    description: `${deployment.namespace}/${deployment.name} (${filePath})`
  };
}

function validateDeploymentStructure(deployment) {
  const errors = [];
  
  if (!deployment.document.spec) {
    errors.push('Deployment sem spec');
  }
  
  if (!deployment.document.spec?.template) {
    errors.push('Deployment sem template');
  }
  
  if (!deployment.document.spec?.template?.spec) {
    errors.push('Deployment sem template.spec');
  }
  
  if (!deployment.document.spec?.template?.spec?.containers) {
    errors.push('Deployment sem containers');
  }
  
  if (deployment.document.spec?.template?.spec?.containers?.length === 0) {
    errors.push('Deployment com array de containers vazio');
  }
  
  return errors;
}

function createDeploymentSummary(deployments) {
  const summary = {
    total: deployments.length,
    byNamespace: {},
    files: new Set()
  };
  
  deployments.forEach(deployment => {
    if (!summary.byNamespace[deployment.namespace]) {
      summary.byNamespace[deployment.namespace] = 0;
    }
    summary.byNamespace[deployment.namespace]++;
    summary.files.add(deployment.filePath);
  });
  
  summary.uniqueFiles = summary.files.size;
  
  return summary;
}

module.exports = {
  extractAppSuffix,
  generateSubsystemName,
  formatDeploymentInfo,
  validateDeploymentStructure,
  createDeploymentSummary
};