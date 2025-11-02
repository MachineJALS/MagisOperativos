// server/scripts/syncS3Files.js - VERSIÓN CON DEBUG DETALLADO
const AWS = require('aws-sdk');
const { db } = require('../config/firebase');

class S3Sync {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });
    this.bucket = process.env.S3_BUCKET;
  }

  async syncFolder(folderPath, ownerId, ownerEmail) {
    try {
      console.log(`\n🎯 INICIANDO SINCRONIZACIÓN PARA: ${folderPath}`);
      console.log(`   👤 Usuario: ${ownerEmail} (${ownerId})`);
      
      let allObjects = [];
      let continuationToken = null;
      
      do {
        const objects = await this.s3.listObjectsV2({
          Bucket: this.bucket,
          Prefix: folderPath,
          MaxKeys: 1000,
          ContinuationToken: continuationToken
        }).promise();

        allObjects = allObjects.concat(objects.Contents || []);
        continuationToken = objects.NextContinuationToken;
        
        console.log(`   📥 Lote: ${objects.Contents?.length || 0} archivos`);
      } while (continuationToken);

      console.log(`📊 Total encontrados en ${folderPath}: ${allObjects.length} objetos`);
      
      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Filtrar solo archivos (no carpetas)
      const files = allObjects.filter(obj => !obj.Key.endsWith('/'));
      console.log(`📁 Archivos a procesar: ${files.length}`);
      
      for (const [index, object] of files.entries()) {
        console.log(`\n   🔄 Procesando [${index + 1}/${files.length}]: ${object.Key}`);
        const result = await this.registerFileInFirebase(object.Key, ownerId, ownerEmail);
        
        if (result === 'synced') {
          syncedCount++;
          console.log(`      ✅ SINCRONIZADO`);
        } else if (result === 'skipped') {
          skippedCount++;
          console.log(`      ⏭️  YA EXISTÍA`);
        } else {
          errorCount++;
          console.log(`      ❌ ERROR`);
        }
      }

      console.log(`\n✅ RESUMEN ${folderPath}:`);
      console.log(`   🆕 Nuevos: ${syncedCount}`);
      console.log(`   ⏭️  Existían: ${skippedCount}`);
      console.log(`   ❌ Errores: ${errorCount}`);
      console.log(`   📦 Total: ${files.length}`);

      return { 
        synced: syncedCount, 
        skipped: skippedCount, 
        errors: errorCount, 
        total: files.length 
      };

    } catch (error) {
      console.error('❌ Error sincronizando carpeta:', error);
      throw error;
    }
  }

  async registerFileInFirebase(s3Key, ownerId, ownerEmail) {
    try {
      // Verificar si el archivo ya existe en Firebase
      const existingFiles = await db.collection('mediaFiles')
        .where('storageInfo.path', '==', s3Key)
        .get();

      if (!existingFiles.empty) {
        return 'skipped';
      }

      // Obtener metadata del archivo S3
      const headResult = await this.s3.headObject({
        Bucket: this.bucket,
        Key: s3Key
      }).promise();

      const fileName = s3Key.split('/').pop();
      const fileType = this.determineFileType(s3Key);
      
      const fileUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
      
      const mediaData = {
        originalName: fileName,
        fileName: fileName,
        ownerId: ownerId,
        ownerEmail: ownerEmail,
        fileType: fileType,
        mimeType: headResult.ContentType || this.getContentType(s3Key),
        size: headResult.ContentLength || 0,
        storageInfo: {
          storageType: 's3',
          path: s3Key,
          key: s3Key,
          bucket: this.bucket,
          region: process.env.AWS_REGION,
          url: fileUrl
        },
        permissions: [{
          userId: ownerId,
          email: ownerEmail,
          access: 'owner',
          grantedAt: new Date()
        }],
        metadata: {
          uploadDate: headResult.LastModified || new Date(),
          lastAccessed: new Date(),
          syncedFromS3: true,
          syncDate: new Date()
        },
        isPublic: false,
        conversionStatus: 'none'
      };

      const docRef = await db.collection('mediaFiles').add(mediaData);
      console.log(`      📝 Registrado en Firebase ID: ${docRef.id}`);
      return 'synced';

    } catch (error) {
      console.error(`      💥 Error: ${error.message}`);
      return 'error';
    }
  }

  determineFileType(filename) {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv'];
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    
    return 'other';
  }

  getContentType(filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const contentTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}

module.exports = S3Sync;