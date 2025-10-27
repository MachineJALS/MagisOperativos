// server/scripts/testFirebase.js
const { db } = require('../config/firebase');

async function testFirebaseConnection() {
    try {
        console.log('🧪 Probando conexión a Firebase...');
        
        // Operación simple de lectura/escritura
        const testRef = db.collection('connection_test');
        
        // Escribir
        await testRef.doc('magisoperativos_test').set({
            test: true,
            message: 'Conexión exitosa a MAGISOPERATIVOS',
            timestamp: new Date()
        });
        
        console.log('✅ Escritura exitosa');
        
        // Leer
        const doc = await testRef.doc('magisoperativos_test').get();
        if (doc.exists) {
            console.log('✅ Lectura exitosa');
            console.log('   Datos:', doc.data());
        }
        
        // Limpiar
        await testRef.doc('magisoperativos_test').delete();
        console.log('✅ Limpieza exitosa');
        
        console.log('\n🎉 ¡Firebase está funcionando correctamente!');
        return true;
        
    } catch (error) {
        console.error('❌ Error en la conexión:');
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        
        if (error.code === 5) {
            console.error('\n💡 SOLUCIÓN: Firestore no está habilitado.');
            console.error('   Ve a Firebase Console > Tu proyecto > Firestore Database > Crear base de datos');
        }
        
        return false;
    }
}

testFirebaseConnection();