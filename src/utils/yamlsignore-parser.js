const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function loadYamlsIgnore(directory) {
  const ignorePaths = [];
  const yamlsIgnorePath = path.join(directory, '.yamlsignore');
  
  try {
    if (await fs.pathExists(yamlsIgnorePath)) {
      const content = await fs.readFile(yamlsIgnorePath, 'utf8');
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      for (const line of lines) {
        // Normalizar path para ser absoluto
        const ignorePath = path.isAbsolute(line) ? line : path.join(directory, line);
        ignorePaths.push(ignorePath);
      }
      
      console.log(chalk.blue(`📋 .yamlsignore encontrado: ${ignorePaths.length} padrões de exclusão`));
      if (ignorePaths.length > 0) {
        console.log(chalk.gray(`   Ignorando: ${ignorePaths.map(p => path.relative(directory, p)).join(', ')}`));
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Erro ao ler .yamlsignore: ${error.message}`));
  }
  
  return ignorePaths;
}

function shouldIgnorePath(filePath, ignorePaths, baseDirectory) {
  const relativePath = path.relative(baseDirectory, filePath);
  const absolutePath = path.resolve(filePath);
  
  for (const ignorePath of ignorePaths) {
    const ignoreAbsolute = path.resolve(ignorePath);
    const ignoreRelative = path.relative(baseDirectory, ignorePath);
    
    // Verificar se o arquivo está dentro de uma pasta ignorada
    if (absolutePath.startsWith(ignoreAbsolute + path.sep) || absolutePath === ignoreAbsolute) {
      return true;
    }
    
    // Verificar com path relativo
    if (relativePath.startsWith(ignoreRelative + path.sep) || relativePath === ignoreRelative) {
      return true;
    }
    
    // Suporte para wildcards simples
    if (ignoreRelative.includes('*')) {
      const regex = new RegExp(ignoreRelative.replace(/\*/g, '.*'));
      if (regex.test(relativePath)) {
        return true;
      }
    }
  }
  
  return false;
}

function createIgnoreFilter(ignorePaths, baseDirectory) {
  return (filePath) => {
    return !shouldIgnorePath(filePath, ignorePaths, baseDirectory);
  };
}

function parseYamlsIgnorePatterns(patterns, baseDirectory) {
  return patterns.map(pattern => {
    // Se for um padrão relativo, converter para absoluto
    if (!path.isAbsolute(pattern)) {
      return path.join(baseDirectory, pattern);
    }
    return pattern;
  });
}

module.exports = {
  loadYamlsIgnore,
  shouldIgnorePath,
  createIgnoreFilter,
  parseYamlsIgnorePatterns
};