// server/scripts/syncS3Files.js
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

  async syncFolder(folderPath, defaultOwner = 'system') {
    try {
      console.log(`🔍 Escaneando carpeta: ${folderPath}`);
      
      const objects = await this.s3.listObjectsV2({
        Bucket: this.bucket,
        Prefix: folderPath
      }).promise();

      let syncedCount = 0;
      
      for (const object of objects.Contents) {
        if (!object.Key.endsWith('/')) { // No es una carpeta
          await this.registerFileInFirebase(object.Key, defaultOwner);
          syncedCount++;
        }
      }

      console.log(`✅ Sincronizados ${syncedCount} archivos de ${folderPath}`);
      return syncedCount;
    } catch (error) {
      console.error('❌ Error sincronizando carpeta:', error);
      throw error;
    }
  }

  async registerFileInFirebase(s3Key, ownerId) {
    try {
      // Verificar si el archivo ya existe en Firebase
      const existingFile = await db.collection('mediaFiles')
        .where('storageInfo.path', '==', s3Key)
        .get();

      if (!existingFile.empty) {
        console.log(`📁 Archivo ya existe: ${s3Key}`);
        return;
      }

      // Obtener metadata del archivo S3
      const headResult = await this.s3.headObject({
        Bucket: this.bucket,
        Key: s3Key
      }).promise();

      const fileName = s3Key.split('/').pop();
      const fileType = this.determineFileType(s3Key);
      
      const mediaData = {
        originalName: fileName,
        fileName: fileName,
        ownerId: ownerId,
        ownerEmail: 'system@magisoperativos.com',
        fileType: fileType,
        mimeType: headResult.ContentType || 'application/octet-stream',
        size: headResult.ContentLength || 0,
        storageInfo: {
          storageType: 's3',
          path: s3Key,
          key: s3Key,
          bucket: this.bucket,
          url: `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
        },
        permissions: [{
          userId: ownerId,
          email: 'system@magisoperativos.com',
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

      await db.collection('mediaFiles').add(mediaData);
      console.log(`✅ Registrado: ${fileName}`);

    } catch (error) {
      console.error(`❌ Error registrando ${s3Key}:`, error.message);
    }
  }

  determineFileType(filename) {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    if (imageExtensions.includes(ext)) return 'image';
    
    return 'other';
  }
}

module.exports = S3Sync;