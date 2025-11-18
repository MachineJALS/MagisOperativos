// server/services/awsUploader.js
const AWS = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');

class AWSUploader {
  constructor() {
    // Verificar que las variables de AWS estén configuradas
    if (!process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY) {
      console.warn('⚠️  Variables de AWS no configuradas completamente');
    }
    
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucket = process.env.S3_BUCKET || 'amzn-s3-operative-bucket';
  }

  async uploadFile(localFilePath, s3Key, options = {}) {
    try {
      console.log(`☁️  Subiendo archivo a S3: ${localFilePath} -> ${s3Key}`);

      // Verificar que el archivo local existe
      if (!await fs.pathExists(localFilePath)) {
        throw new Error(`Archivo local no encontrado: ${localFilePath}`);
      }

      const fileContent = await fs.readFile(localFilePath);
      
      const params = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: options.contentType || this.getContentType(path.extname(s3Key)),
        Metadata: options.metadata || {}
      };

      const result = await this.s3.upload(params).promise();
      
      console.log(`✅ Archivo subido exitosamente: ${result.Location}`);
      return {
        success: true,
        location: result.Location,
        key: result.Key,
        etag: result.ETag
      };
    } catch (error) {
      console.error(`❌ Error subiendo archivo a S3: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadLocalFile(localRelativePath, s3Folder = 'uploads') {
    try {
      // Construir ruta completa al archivo local
      const localFilePath = path.join(__dirname, '../../storage', localRelativePath);
      
      console.log(`📁 Buscando archivo local: ${localFilePath}`);
      
      if (!await fs.pathExists(localFilePath)) {
        return {
          success: false,
          error: `Archivo local no encontrado: ${localRelativePath}`
        };
      }

      const fileName = path.basename(localRelativePath);
      const s3Key = `${s3Folder}/${fileName}`;
      
      const stats = await fs.stat(localFilePath);
      const contentType = this.getContentType(path.extname(fileName));
      
      console.log(`📤 Subiendo a S3: ${localFilePath} -> ${s3Key}`);
      
      return await this.uploadFile(localFilePath, s3Key, {
        contentType: contentType,
        metadata: {
          originalPath: localRelativePath,
          fileSize: stats.size.toString(),
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error en uploadLocalFile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async syncFolderToS3(localFolder, s3Folder) {
    try {
      const localPath = path.join(__dirname, '../../storage', localFolder);
      
      console.log(`🔄 Sincronizando carpeta: ${localPath} -> s3://${this.bucket}/${s3Folder}`);
      
      if (!await fs.pathExists(localPath)) {
        return {
          success: false,
          error: `Carpeta local no encontrada: ${localFolder}`
        };
      }

      const files = await fs.readdir(localPath);
      const results = [];

      console.log(`📁 Encontrados ${files.length} archivos en ${localFolder}`);

      for (const file of files) {
        const filePath = path.join(localPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          console.log(`📤 Sincronizando: ${file}`);
          const result = await this.uploadLocalFile(`${localFolder}/${file}`, s3Folder);
          results.push({
            file: file,
            ...result
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`✅ Sincronización completada: ${successful} exitosos, ${failed} fallidos`);

      return {
        success: true,
        summary: {
          total: files.length,
          successful: successful,
          failed: failed
        },
        details: results
      };

    } catch (error) {
      console.error(`❌ Error sincronizando carpeta: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getContentType(extension) {
    const ext = extension.toLowerCase();
    const types = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };
    
    return types[ext] || 'application/octet-stream';
  }

  async getSignedUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: s3Key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return {
        success: true,
        url: url,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      };
    } catch (error) {
      console.error(`❌ Error generando URL firmada: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar conexión a S3
  async testConnection() {
    try {
      await this.s3.listBuckets().promise();
      return {
        success: true,
        message: '✅ Conexión a S3 establecida correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: `❌ Error conectando a S3: ${error.message}`
      };
    }
  }
}

module.exports = new AWSUploader();