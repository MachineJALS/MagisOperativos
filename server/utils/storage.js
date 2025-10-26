// En server/utils/storage.js
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

class StorageManager {
  constructor() {
    this.type = process.env.STORAGE_TYPE || 'local';
    
    if (this.type === 's3') {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION
      });
      this.bucket = process.env.S3_BUCKET;
    }
    
    this.localPath = process.env.STORAGE_PATH || './storage';
  }

  async saveFile(fileBuffer, filename, folder = 'media') {
    const fullPath = `${folder}/${filename}`;
    
    if (this.type === 's3') {
      return await this.saveToS3(fileBuffer, fullPath);
    } else {
      return await this.saveToLocal(fileBuffer, fullPath);
    }
  }

  async saveToS3(fileBuffer, filePath) {
    const params = {
      Bucket: this.bucket,
      Key: filePath,
      Body: fileBuffer,
      ACL: 'public-read'
    };
    
    const result = await this.s3.upload(params).promise();
    return {
      url: result.Location,
      path: filePath,
      storageType: 's3'
    };
  }

  async saveToLocal(fileBuffer, filePath) {
    const fullLocalPath = path.join(this.localPath, filePath);
    const dir = path.dirname(fullLocalPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullLocalPath, fileBuffer);
    return {
      url: `/api/files/${filePath}`,
      path: fullLocalPath,
      storageType: 'local'
    };
  }

  async getFile(filePath) {
    if (this.type === 's3') {
      const params = {
        Bucket: this.bucket,
        Key: filePath
      };
      return await this.s3.getObject(params).promise();
    } else {
      const fullPath = path.join(this.localPath, filePath);
      return fs.createReadStream(fullPath);
    }
  }
}

module.exports = new StorageManager();