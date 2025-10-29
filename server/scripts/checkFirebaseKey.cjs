require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando clave privada de Firebase...\n');

// Verificar si estamos usando archivo JSON
const jsonPath = path.join(__dirname, '../../firebase-service-account.json');
if (fs.existsSync(jsonPath)) {
  console.log('✅ Archivo JSON de Firebase encontrado');
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ Archivo JSON válido');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    console.log('   Private Key Length:', serviceAccount.private_key?.length || 'No encontrada');
  } catch (error) {
    console.error('❌ Error leyendo archivo JSON:', error.message);
  }
}

// Verificar variables de entorno
console.log('\n🔍 Verificando variables de entorno:');
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ CONFIGURADA' : '❌ NO CONFIGURADA');

if (process.env.FIREBASE_PRIVATE_KEY) {
  console.log('Longitud de la clave:', process.env.FIREBASE_PRIVATE_KEY.length);
  console.log('Primeros 50 caracteres:', process.env.FIREBASE_PRIVATE_KEY.substring(0, 50) + '...');
  
  // Verificar formato PEM
  if (process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    console.log('✅ Formato PEM detectado');
  } else {
    console.log('❌ No parece estar en formato PEM');
  }
}

// Probar la configuración de Firebase
console.log('\n🔄 Probando configuración de Firebase...');

// Función async para probar Firebase
async function testFirebase() {
  try {
    // Importar dinámicamente para evitar problemas de carga
    const { db } = require('../config/firebase');
    console.log('✅ Firebase configurado correctamente');
    
    // Probar conexión simple
    const testRef = db.collection('test');
    await testRef.doc('connection-test').set({ test: true, timestamp: new Date() });
    console.log('✅ Conexión a Firestore exitosa');
    await testRef.doc('connection-test').delete();
    console.log('✅ Documento de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error configurando Firebase:');
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('PEM')) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('1. Usa el archivo JSON directamente en lugar de variables de entorno');
      console.log('2. O asegúrate de que FIREBASE_PRIVATE_KEY tenga el formato correcto con \\n');
    }
  }
}

// Ejecutar la prueba
testFirebase();