// server/scripts/initFirebase.js
const { db } = require('../config/firebase');

async function initializeFirebase() {
    try {
        console.log('🚀 Inicializando Firebase...');
        console.log('⏳ Esperando que Firestore esté listo...');

        // Esperar un poco para que Firestore se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Verificar conexión con una operación más simple
        console.log('🔍 Probando conexión a Firestore...');
        
        const testCollection = db.collection('_test_connection');
        await testCollection.doc('test').set({
            message: 'Test de conexión MAGISOPERATIVOS',
            timestamp: new Date()
        });
        
        console.log('✅ Conexión a Firestore establecida correctamente');

        // Eliminar el documento de prueba
        await testCollection.doc('test').delete();

        // Crear colecciones base
        const collections = ['users', 'mediaFiles', 'nodes', 'conversionTasks'];
        
        console.log('📁 Creando colecciones...');
        
        for (const collectionName of collections) {
            try {
                const collectionRef = db.collection(collectionName);
                
                // Intentar escribir un documento de inicialización
                await collectionRef.doc('system_init').set({
                    initialized: true,
                    project: 'MAGISOPERATIVOS',
                    timestamp: new Date(),
                    version: '1.0.0'
                });
                
                console.log(`✅ Colección "${collectionName}" creada/inicializada`);
                
            } catch (collectionError) {
                console.log(`⚠️  Colección "${collectionName}" ya existe o no se pudo crear:`, collectionError.message);
            }
        }
        
        console.log('🎉 Firebase Firestore inicializado correctamente para MAGISOPERATIVOS');
        console.log('📊 Colecciones listas: users, mediaFiles, nodes, conversionTasks');
        
        // Mostrar información del proyecto
        console.log('\n📋 Resumen de configuración:');
        console.log(`   - Proyecto: magisoperativos-226d4`);
        console.log(`   - Base de datos: Firestore`);
        console.log(`   - Estado: ✅ CONFIGURADO`);
        
    } catch (error) {
        console.error('❌ Error inicializando Firebase:');
        
        if (error.code === 5 || error.message.includes('NOT_FOUND')) {
            console.error('');
            console.error('🔴 PROBLEMA: Firestore no está habilitado en tu proyecto de Firebase.');
            console.error('');
            console.error('🟡 SOLUCIÓN: Sigue estos pasos:');
            console.error('   1. Ve a https://console.firebase.google.com/');
            console.error('   2. Selecciona tu proyecto "magisoperativos-226d4"');
            console.error('   3. En el menú lateral, haz clic en "Firestore Database"');
            console.error('   4. Haz clic en "Crear base de datos"');
            console.error('   5. Elige "Modo de prueba" y la ubicación más cercana');
            console.error('   6. Espera a que se cree la base de datos');
            console.error('   7. Ejecuta este script nuevamente');
            console.error('');
        } else if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
            console.error('');
            console.error('🔴 PROBLEMA: Permisos insuficientes.');
            console.error('🟡 SOLUCIÓN: Verifica que el archivo de servicio tenga los permisos correctos.');
            console.error('');
        } else {
            console.error('   Detalles técnicos:', error.message);
            console.error('   Código:', error.code);
        }
        
        process.exit(1);
    }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
    initializeFirebase();
}

module.exports = initializeFirebase;