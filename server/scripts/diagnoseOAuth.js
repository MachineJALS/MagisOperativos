const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 DIAGNÓSTICO COMPLETO DE GOOGLE OAUTH\n');

// 1. Verificar variables
console.log('1. 📋 VARIABLES DE ENTORNO:');
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'JWT_SECRET',
  'CLIENT_URL'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '✅' : '❌'} ${value ? value.substring(0, 20) + '...' : 'NO CONFIGURADO'}`);
});

// 2. Verificar formato de Google Client ID
console.log('\n2. 🔍 FORMATO DE CREDENCIALES GOOGLE:');
if (process.env.GOOGLE_CLIENT_ID) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId.startsWith('{') || clientId.includes(' ')) {
    console.log('   ❌ CLIENT_ID parece tener formato incorrecto (posibles comillas extras)');
  } else {
    console.log('   ✅ CLIENT_ID tiene formato adecuado');
  }
}

// 3. Verificar URLs de Google OAuth
console.log('\n3. 🌐 URLs DE GOOGLE OAUTH:');
console.log('   Authorization URL: https://accounts.google.com/o/oauth2/v2/auth');
console.log('   Token URL: https://oauth2.googleapis.com/token');
console.log('   Callback URL: http://localhost:3000/auth/google/callback');

// 4. Probar Passport.js
console.log('\n4. 🔐 PROBANDO PASSPORT.JS:');
try {
  const passport = require('../config/passport');
  console.log('   ✅ Passport.js se carga correctamente');
} catch (error) {
  console.log('   ❌ Error cargando passport.js:', error.message);
}

console.log('\n💡 SOLUCIÓN SI HAY ERRORES:');
console.log('   1. Verifica que las variables en .env no tengan comillas extras');
console.log('   2. Asegúrate de que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET sean exactos');
console.log('   3. Reinicia el servidor después de hacer cambios');