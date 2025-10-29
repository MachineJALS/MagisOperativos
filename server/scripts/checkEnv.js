require('dotenv').config();

console.log('🔍 Verificación de Variables de Entorno:\n');

const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_KEY',
  'S3_BUCKET'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isConfigured = value && value.length > 0;
  
  console.log(`${varName}: ${isConfigured ? '✅ CONFIGURADO' : '❌ FALTANTE'}`);
  
  if (!isConfigured) {
    allConfigured = false;
    
    if (varName === 'GOOGLE_CLIENT_ID' || varName === 'GOOGLE_CLIENT_SECRET') {
      console.log('   💡 Obtén estas credenciales en: https://console.cloud.google.com/');
    } else if (varName === 'JWT_SECRET') {
      console.log('   💡 Genera un secreto seguro para JWT');
    }
  }
});

console.log('\n' + (allConfigured ? 
  '🎉 Todas las variables están configuradas. El servidor debería iniciar correctamente.' :
  '❌ Faltan variables de entorno. Por favor, configura las variables faltantes.'
));

if (!allConfigured) {
  process.exit(1);
}