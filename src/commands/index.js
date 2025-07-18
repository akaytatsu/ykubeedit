const addOtelCommand = require('./add-otel');

const commands = {
  'add-otel': addOtelCommand
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