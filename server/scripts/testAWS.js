// server/scripts/testAWS.js
require('dotenv').config();
const storageManager = require('../utils/storage');

async function testAWSConnection() {
    console.log('🧪 Probando conexión con AWS S3...\n');
    console.log('🔍 Configuración detectada:');
    console.log(`   - Bucket: ${process.env.S3_BUCKET}`);
    console.log(`   - Region: ${process.env.AWS_REGION}`);
    console.log(`   - Storage Type: ${process.env.STORAGE_TYPE}`);
    console.log(`   - Access Key: ${process.env.AWS_ACCESS_KEY ? '✅ Configurada' : '❌ Faltante'}`);
    console.log(`   - Secret Key: ${process.env.AWS_SECRET_KEY ? '✅ Configurada' : '❌ Faltante'}`);
    console.log('');

    try {
        // Verificar que storageManager tenga el método testConnection
        if (typeof storageManager.testConnection !== 'function') {
            throw new Error('storageManager no tiene el método testConnection');
        }

        // Test de conexión
        console.log('📡 Realizando test de conexión...');
        const connectionTest = await storageManager.testConnection();
        console.log('✅ Resultado del test:');
        console.log(connectionTest);
        console.log('');

        if (connectionTest.connected && storageManager.storageType === 's3') {
            console.log('🎉 ¡AWS S3 está funcionando correctamente!');
            
            // Test de subida de archivo
            console.log('\n📤 Probando subida de archivo...');
            const testContent = Buffer.from('Este es un archivo de prueba de MAGISOPERATIVOS - ' + new Date().toISOString());
            const uploadResult = await storageManager.uploadFile(testContent, 'test-file.txt', 'test');
            console.log('✅ Archivo subido exitosamente:');
            console.log('   - Key:', uploadResult.key);
            console.log('   - Size:', uploadResult.size, 'bytes');
            console.log('   - Storage:', uploadResult.storageType);
            
            // Limpiar archivo de prueba
            console.log('\n🧹 Limpiando archivo de prueba...');
            // Nota: Necesitaríamos implementar deleteFile, pero por ahora está bien
            console.log('✅ Prueba completada (archivo temporal en S3)');
            
        } else if (storageManager.storageType === 'local') {
            console.log('ℹ️  Usando almacenamiento local para pruebas');
        } else {
            console.log('❌ No se pudo conectar a AWS S3');
        }

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
        
        // Mensajes de error específicos
        if (error.code === 'InvalidAccessKeyId') {
            console.log('💡 Solución: El Access Key ID es incorrecto');
        } else if (error.code === 'SignatureDoesNotMatch') {
            console.log('💡 Solución: El Secret Access Key es incorrecto');
        } else if (error.code === 'NoSuchBucket') {
            console.log('💡 Solución: El bucket "amzn-s3-operative-bucket" no existe');
            console.log('   Verifica que el bucket exista en la región us-east-1');
        } else if (error.code === 'AccessDenied') {
            console.log('💡 Solución: El usuario IAM no tiene permisos para S3');
            console.log('   Asigna el policy AmazonS3FullAccess al usuario');
        } else if (error.message.includes('testConnection')) {
            console.log('💡 Solución: Actualiza el archivo storage.js con el método testConnection');
        }
        
        console.log('\n🔧 Para debugging adicional:');
        console.log('   1. Verifica que las credenciales en .env sean correctas');
        console.log('   2. Confirma que el bucket "amzn-s3-operative-bucket" exista');
        console.log('   3. Verifica los permisos del usuario IAM en AWS Console');
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    testAWSConnection();
}

module.exports = testAWSConnection;