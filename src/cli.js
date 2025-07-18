const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const addOtelCommand = require('./commands/add-otel');
const removeCertManagerProdCommand = require('./commands/remove-cert-manager-prod');

async function handleAddOtelCommand(directory, options) {
  console.log(chalk.yellow(`🔍 Escaneando deployments em: ${path.resolve(directory)}`));
  console.log(chalk.gray(`📝 Modo: ${options.dryRun ? 'Preview (--dry-run)' : 'Aplicar mudanças'}\n`));

  try {
    await addOtelCommand.execute(directory, options);
  } catch (error) {
    throw new Error(`Falha no comando add-otel: ${error.message}`);
  }
}

async function handleRemoveCertManagerProdCommand(directory, options) {
  console.log(chalk.yellow(`🔍 Escaneando arquivos de ingress em: ${path.resolve(directory)}`));
  console.log(chalk.gray(`📝 Modo: ${options.dryRun ? 'Preview (--dry-run)' : 'Aplicar mudanças'}\n`));

  try {
    await removeCertManagerProdCommand.execute(directory, options);
  } catch (error) {
    throw new Error(`Falha no comando remove-cert-manager-prod: ${error.message}`);
  }
}

module.exports = {
  addOtelCommand: handleAddOtelCommand,
  removeCertManagerProdCommand: handleRemoveCertManagerProdCommand
};