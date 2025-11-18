// server/start-all.js - EJECUTOR AUTOMÁTICO DE TODO EL SISTEMA
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 INICIANDO SISTEMA DISTRIBUIDO MAGISOPERATIVOS...\n');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para ejecutar comandos con colores
function runCommand(name, command, args, color) {
  console.log(`${color}${colors.bright}▶️  Iniciando ${name}...${colors.reset}`);
  
  const process = spawn(command, args, { 
    stdio: 'pipe',
    shell: true 
  });

  process.stdout.on('data', (data) => {
    console.log(`${color}[${name}] ${data.toString().trim()}${colors.reset}`);
  });

  process.stderr.on('data', (data) => {
    console.log(`${colors.red}[${name} ERROR] ${data.toString().trim()}${colors.reset}`);
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}❌ ${name} se cerró con código ${code}${colors.reset}`);
    }
  });

  return process;
}

// Iniciar todos los procesos
try {
  console.log(`${colors.cyan}${colors.bright}📦 Iniciando servidor principal...${colors.reset}`);
  const mainServer = runCommand(
    'SERVIDOR', 
    'npm', 
    ['run', 'dev'], 
    colors.blue
  );

  // Esperar 5 segundos antes de iniciar nodos
  setTimeout(() => {
    console.log(`\n${colors.cyan}${colors.bright}🖥️  Iniciando nodos distribuidos...${colors.reset}`);
    
    const node1 = runCommand(
      'NODO-1', 
      'node', 
      ['nodes/conversionNode1.js'], 
      colors.green
    );

    const node2 = runCommand(
      'NODO-2', 
      'node', 
      ['nodes/conversionNode2.js'], 
      colors.magenta
    );

    console.log(`\n${colors.yellow}${colors.bright}✅ Todos los procesos iniciados!${colors.reset}`);
    console.log(`${colors.yellow}📍 Servidor Principal: http://localhost:3000${colors.reset}`);
    console.log(`${colors.yellow}📍 Nodo 1: http://localhost:3002${colors.reset}`);
    console.log(`${colors.yellow}📍 Nodo 2: http://localhost:3003${colors.reset}`);
    console.log(`${colors.yellow}📍 Cliente: http://localhost:3001 (debes iniciarlo manualmente)${colors.reset}`);
    console.log(`\n${colors.cyan}Presiona Ctrl+C para detener todos los procesos${colors.reset}`);

    // Manejar cierre graceful
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}🛑 Deteniendo todos los procesos...${colors.reset}`);
      mainServer.kill();
      node1.kill();
      node2.kill();
      process.exit(0);
    });

  }, 5000);

} catch (error) {
  console.error(`${colors.red}❌ Error iniciando el sistema: ${error.message}${colors.reset}`);
}