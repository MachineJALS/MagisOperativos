const path = require('path');
const fs = require('fs');

console.log('📁 Verificando ubicación del archivo .env\n');

const possiblePaths = [
  path.join(__dirname, '../.env'),           // Raíz del proyecto
  path.join(__dirname, '../../.env'),        // Si estás en server/scripts/
  path.join(__dirname, '.env'),              // Carpeta actual
];

let envFound = false;

possiblePaths.forEach(envPath => {
  const exists = fs.existsSync(envPath);
  console.log(`${envPath}: ${exists ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
  
  if (exists && !envFound) {
    envFound = true;
    console.log('🔍 Contenido del archivo .env (solo nombres de variables):');
    
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      lines.forEach(line => {
        const varName = line.split('=')[0];
        console.log(`   - ${varName}`);
      });
    } catch (error) {
      console.log('   Error leyendo archivo:', error.message);
    }
  }
});

if (!envFound) {
  console.log('\n❌ No se encontró el archivo .env en ninguna ubicación común');
  console.log('💡 Crea un archivo .env en la raíz del proyecto con las variables necesarias');
} else {
  console.log('\n✅ Archivo .env encontrado correctamente');
}