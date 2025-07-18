#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const cli = require('../src/cli');

function showBanner() {
  console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                        YKubeEdit                             ║
║            CLI para Edição em Massa de YAMLs K8s           ║
╚══════════════════════════════════════════════════════════════╝
  `));
}

async function main() {
  const program = new Command();

  program
    .name('ykubeedit')
    .description('CLI tool para edição em massa de YAMLs do Kubernetes')
    .version(pkg.version, '-v, --version', 'exibir versão atual')
    .helpOption('-h, --help', 'exibir ajuda')
    .hook('preAction', () => {
      showBanner();
    });

  program
    .command('add-otel')
    .description('Adicionar configurações OpenTelemetry em deployments')
    .argument('[directory]', 'diretório para escanear (padrão: diretório atual)', process.cwd())
    .option('--dry-run', 'preview das mudanças sem modificar arquivos')
    .action(async (directory, options) => {
      try {
        await cli.addOtelCommand(directory, options);
      } catch (error) {
        console.error(chalk.red('\n❌ Erro:'), error.message);
        process.exit(1);
      }
    });

  program.parse();
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('\n❌ Erro fatal:'), error.message);
    process.exit(1);
  });
}

module.exports = { main };