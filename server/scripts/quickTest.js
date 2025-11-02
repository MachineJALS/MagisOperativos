// server/scripts/quickTest.js - VERSIÓN CON PAGINACIÓN
require('dotenv').config({ path: '../.env' });
const AWS = require('aws-sdk');

async function quickTest() {
  console.log('🚀 TEST RÁPIDO S3 CON PAGINACIÓN');
  console.log('🔑 Credenciales cargadas:', {
    accessKey: '✅ Presente',
    secretKey: '✅ Presente',
    region: process.env.AWS_REGION,
    bucket: process.env.S3_BUCKET
  });
  
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
  });

  try {
    // 1. Verificar conexión
    console.log('1. 🔗 Probando conexión...');
    await s3.headBucket({ Bucket: process.env.S3_BUCKET }).promise();
    console.log('   ✅ Conexión exitosa');

    // 2. Listar archivos en movies/ CON PAGINACIÓN
    console.log('2. 🎬 Listando movies/ (con paginación)...');
    let moviesFiles = [];
    let moviesContinuationToken = null;
    
    do {
      const movies = await s3.listObjectsV2({
        Bucket: process.env.S3_BUCKET,
        Prefix: 'movies/',
        MaxKeys: 1000,
        ContinuationToken: moviesContinuationToken
      }).promise();

      moviesFiles = moviesFiles.concat(movies.Contents || []);
      moviesContinuationToken = movies.NextContinuationToken;
    } while (moviesContinuationToken);

    console.log(`   ✅ Encontrados ${moviesFiles.length} archivos en movies/:`);
    moviesFiles.forEach(obj => {
      if (!obj.Key.endsWith('/')) {
        console.log(`      - ${obj.Key} (${obj.Size} bytes)`);
      }
    });

    // 3. Listar archivos en music/ CON PAGINACIÓN
    console.log('3. 🎵 Listando music/ (con paginación)...');
    let musicFiles = [];
    let musicContinuationToken = null;
    
    do {
      const music = await s3.listObjectsV2({
        Bucket: process.env.S3_BUCKET,
        Prefix: 'music/',
        MaxKeys: 1000,
        ContinuationToken: musicContinuationToken
      }).promise();

      musicFiles = musicFiles.concat(music.Contents || []);
      musicContinuationToken = music.NextContinuationToken;
    } while (musicContinuationToken);

    console.log(`   ✅ Encontrados ${musicFiles.length} archivos en music/:`);
    musicFiles.forEach(obj => {
      if (!obj.Key.endsWith('/')) {
        console.log(`      - ${obj.Key} (${obj.Size} bytes)`);
      }
    });

    // 4. Resumen
    console.log('\n4. 📊 RESUMEN FINAL:');
    console.log(`   🎬 Movies: ${moviesFiles.length} archivos`);
    console.log(`   🎵 Music: ${musicFiles.length} archivos`);
    console.log(`   📦 Total: ${moviesFiles.length + musicFiles.length} archivos`);

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

if (require.main === module) {
  quickTest();
}

module.exports = quickTest;