const addOtelCommand = require('./add-otel');
const removeCertManagerProdCommand = require('./remove-cert-manager-prod');

const commands = {
  'add-otel': addOtelCommand,
  'remove-cert-manager-prod': removeCertManagerProdCommand
};

function getCommand(commandName) {
  return commands[commandName];
}

function listAvailableCommands() {
  return Object.keys(commands);
}

module.exports = {
  getCommand,
  listAvailableCommands,
  commands
};