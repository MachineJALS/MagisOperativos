const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔧 Configurando Firebase...');

// Opción 1: Usar archivo JSON (RECOMENDADO)
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Usando archivo JSON de servicio:', serviceAccountPath);
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('✅ Firebase inicializado desde archivo JSON');
  } catch (error) {
    console.error('❌ Error inicializando Firebase con archivo JSON:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
} else {
  console.log('❌ Archivo JSON no encontrado en:', serviceAccountPath);
  console.log('💡 Asegúrate de que firebase-service-account.json esté en la raíz del proyecto');
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// Probar conexión
async function testConnection() {
  try {
    const testRef = db.collection('_connection_test');
    await testRef.doc('test').set({ 
      message: 'Test de conexión MAGISOPERATIVOS',
      timestamp: new Date() 
    });
    console.log('✅ Conexión a Firestore verificada');
    
    // Limpiar
    await testRef.doc('test').delete();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Firestore:', error.message);
    return false;
  }
}

// Ejecutar prueba de conexión al iniciar
testConnection().then(success => {
  if (success) {
    console.log('🎉 Firebase configurado y conectado correctamente');
  } else {
    console.log('❌ Firebase configurado pero hay problemas de conexión');
  }
});

module.exports = { admin, db, auth, testConnection };