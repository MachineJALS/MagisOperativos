require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log('🧪 Probando configuración de Google OAuth...\n');

// Verificar que las variables estén cargadas
console.log('🔍 Variables de entorno cargadas:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');

// Verificar longitudes (solo para debug)
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('Longitud CLIENT_ID:', process.env.GOOGLE_CLIENT_ID.length);
}
if (process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Longitud CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET.length);
}

// Intentar crear la estrategia de Google
try {
  console.log('\n🔄 Intentando crear GoogleStrategy...');
  
  const strategy = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, (accessToken, refreshToken, profile, done) => {
    console.log('✅ Callback de Google ejecutado');
    return done(null, profile);
  });

  console.log('✅ GoogleStrategy creada exitosamente');
  console.log('🎉 La configuración de Google OAuth es correcta');

} catch (error) {
  console.error('❌ Error creando GoogleStrategy:');
  console.error('Mensaje:', error.message);
  console.error('Tipo:', error.name);
  
  if (error.message.includes('clientID')) {
    console.log('\n💡 POSIBLE SOLUCIÓN:');
    console.log('1. Verifica que GOOGLE_CLIENT_ID en .env no tenga espacios extras');
    console.log('2. Asegúrate de que el archivo .env esté en la raíz del proyecto');
    console.log('3. Verifica que estés ejecutando desde la raíz del proyecto');
  }
}

// Probar también la carga de passport completo
console.log('\n🔄 Probando carga completa de passport...');
try {
  const passport = require('../config/passport');
  console.log('✅ Passport cargado exitosamente');
} catch (passportError) {
  console.error('❌ Error cargando passport:');
  console.error(passportError.message);
}