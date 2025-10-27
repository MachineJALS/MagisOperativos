const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class StorageManager {
    constructor() {
        this.storageType = process.env.STORAGE_TYPE || 'local';
        this.setupS3();
        this.setupLocalStorage();
    }

    setupS3() {
        if (this.storageType === 's3') {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            });
            this.s3 = new AWS.S3();
            this.bucket = process.env.S3_BUCKET;
            console.log('✅ AWS S3 configurado para bucket:', this.bucket);
        }
    }

    setupLocalStorage() {
        this.localStoragePath = path.join(__dirname, '../../storage');
        if (this.storageType === 'local' && !fs.existsSync(this.localStoragePath)) {
            fs.mkdirSync(this.localStoragePath, { recursive: true });
            ['audio', 'video', 'images', 'converted', 'temp'].forEach(folder => {
                fs.mkdirSync(path.join(this.localStoragePath, folder), { recursive: true });
            });
            console.log('✅ Almacenamiento local configurado');
        }
    }

    // 🔥 AÑADE ESTE MÉTODO QUE FALTABA:
    async testConnection() {
        if (this.storageType !== 's3') {
            return { 
                connected: true, 
                message: '✅ Usando almacenamiento local',
                type: 'local'
            };
        }
        
        try {
            await this.s3.headBucket({ Bucket: this.bucket }).promise();
            return { 
                connected: true, 
                message: '✅ Conexión S3 exitosa',
                type: 's3',
                bucket: this.bucket,
                region: process.env.AWS_REGION
            };
        } catch (error) {
            return { 
                connected: false, 
                message: `❌ Error S3: ${error.message}`,
                type: 's3',
                error: error.code
            };
        }
    }

    async uploadFile(fileBuffer, originalName, folder = 'media') {
        const fileExtension = path.extname(originalName);
        const fileName = path.basename(originalName, fileExtension);
        const uniqueFileName = `${fileName}_${uuidv4()}${fileExtension}`;
        const filePath = `${folder}/${uniqueFileName}`;

        try {
            let result;
            if (this.storageType === 's3') {
                result = await this.uploadToS3(fileBuffer, filePath);
            } else {
                result = await this.uploadToLocal(fileBuffer, filePath);
            }

            console.log(`✅ Archivo subido: ${originalName} -> ${filePath}`);
            return result;

        } catch (error) {
            console.error('❌ Error subiendo archivo:', error);
            throw new Error(`Error al subir archivo: ${error.message}`);
        }
    }

    async uploadToS3(fileBuffer, filePath) {
        const params = {
            Bucket: this.bucket,
            Key: filePath,
            Body: fileBuffer,
            ACL: 'private',
            ContentType: this.getContentType(filePath),
            Metadata: {
                uploadedBy: 'MAGISOPERATIVOS',
                uploadDate: new Date().toISOString()
            }
        };

        const result = await this.s3.upload(params).promise();
        
        return {
            url: result.Location,
            path: filePath,
            storageType: 's3',
            size: fileBuffer.length,
            key: result.Key,
            etag: result.ETag
        };
    }

    async uploadToLocal(fileBuffer, filePath) {
        const fullPath = path.join(this.localStoragePath, filePath);
        const directory = path.dirname(fullPath);

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        fs.writeFileSync(fullPath, fileBuffer);
        
        return {
            url: `/api/files/${filePath}`,
            path: fullPath,
            storageType: 'local',
            size: fileBuffer.length
        };
    }

    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.ogg': 'audio/ogg',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        };
        return contentTypes[ext] || 'application/octet-stream';
    }
}

// 🔥 EXPORTA LA INSTANCIA CORRECTAMENTE
module.exports = new StorageManager();