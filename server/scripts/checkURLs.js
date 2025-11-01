require('dotenv').config({ path: '../../.env' });

console.log('🌐 VERIFICANDO URLs DEL SISTEMA\n');

console.log('1. 📋 VARIABLES DE ENTORNO:');
console.log('   CLIENT_URL:', process.env.CLIENT_URL || '❌ NO CONFIGURADO');
console.log('   PORT:', process.env.PORT || '3000');

console.log('\n2. 🔗 URLs CONFIGURADAS:');
console.log('   Backend API: http://localhost:3000');
console.log('   Frontend React:', process.env.CLIENT_URL || 'http://localhost:3001');

console.log('\n3. 🔐 URLs DE OAUTH:');
console.log('   Inicio OAuth: http://localhost:3000/auth/google');
console.log('   Callback OAuth:', process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/auth/google/callback` : '❌');
console.log('   Redirección post-login:', process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/dashboard?token=XXX` : '❌');

console.log('\n4. 💡 VERIFICACIÓN MANUAL:');
console.log('   - Backend debe estar en puerto 3000');
console.log('   - Frontend debe estar en puerto 3001');
console.log('   - CLIENT_URL debe ser http://localhost:3001');
console.log('   - Google OAuth callback debe estar registrado para el puerto 3001');

if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('3000')) {
  console.log('\n❌ PROBLEMA: CLIENT_URL apunta al puerto 3000 (backend)');
  console.log('   Debe apuntar al puerto 3001 (frontend)');
}