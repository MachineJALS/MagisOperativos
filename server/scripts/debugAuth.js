const path = require('path');

// Ruta CORRECTA: desde server/scripts/ a la raíz del proyecto
const envPath = path.join(__dirname, '../../../.env');
console.log('📁 Buscando .env en:', envPath);

require('dotenv').config({ path: envPath });

console.log('🔍 Debug: Configuración de Autenticación\n');

console.log('📋 Variables de entorno:');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'NO CONFIGURADO');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');

console.log('\n🔗 URLs importantes:');
console.log('Backend:', 'http://localhost:3000');
console.log('Frontend:', process.env.CLIENT_URL || 'http://localhost:3001');
console.log('Google OAuth:', 'http://localhost:3000/auth/google');
console.log('Callback:', 'http://localhost:3000/auth/google/callback');
console.log('Redirección después de login:', `${process.env.CLIENT_URL || 'http://localhost:3001'}/dashboard?token=XXX`);

// Verificar si el archivo .env existe
const fs = require('fs');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
  
  // Mostrar variables (sin valores sensibles)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => 
    line.trim() && !line.startsWith('#') && line.includes('=')
  );
  
  console.log('\n📝 Variables en .env:');
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`   - ${key}`);
  });
} else {
  console.log('❌ Archivo .env NO encontrado en:', envPath);
  console.log('💡 Asegúrate de que el archivo .env esté en la raíz del proyecto');
}