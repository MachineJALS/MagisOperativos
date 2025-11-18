const fs = require('fs-extra');
const path = require('path');
const { db } = require('../config/firebase');

class LocalFileScanner {
    constructor() {
        this.basePath = path.join(__dirname, '../../storage');
    }

    async scanAndRegisterFiles(user) {
        try {
            console.log('🔍 Escaneando archivos locales...');
            
            const audioFiles = await this.scanDirectory('audio', user);
            const videoFiles = await this.scanDirectory('video', user);
            
            console.log(`✅ Escaneo completado: ${audioFiles.length} audio, ${videoFiles.length} video`);
            
            return {
                audio: audioFiles,
                video: videoFiles,
                total: audioFiles.length + videoFiles.length
            };
        } catch (error) {
            console.error('❌ Error escaneando archivos locales:', error);
            throw error;
        }
    }

    async scanDirectory(type, user) {
        const directoryPath = path.join(this.basePath, type);
        const registeredFiles = [];

        // Verificar si el directorio existe
        if (!await fs.pathExists(directoryPath)) {
            console.log(`⚠️  Directorio ${directoryPath} no existe`);
            return [];
        }

        const files = await fs.readdir(directoryPath);
        
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.stat(filePath);

            if (stat.isFile()) {
                try {
                    const registered = await this.registerFile(file, filePath, type, stat, user);
                    if (registered) {
                        registeredFiles.push(registered);
                    }
                } catch (error) {
                    console.error(`❌ Error registrando archivo ${file}:`, error);
                }
            }
        }

        return registeredFiles;
    }

    async registerFile(filename, filePath, fileType, stat, user) {
        // Verificar si el archivo ya está registrado
        const existingFile = await db.collection('mediaFiles')
            .where('fileName', '==', filename)
            .where('ownerId', '==', user.id)
            .get();

        if (!existingFile.empty) {
            console.log(`📁 Archivo ${filename} ya está registrado`);
            return null;
        }

        // Determinar MIME type basado en extensión
        const mimeType = this.getMimeType(filename, fileType);
        
        const fileData = {
            originalName: filename,
            fileName: filename,
            ownerId: user.id,
            ownerEmail: user.email,
            fileType: fileType,
            mimeType: mimeType,
            size: stat.size,
            storageInfo: {
                storageType: 'local',
                path: filePath,
                url: `/api/files/local/${fileType}/${filename}`,
                actualPath: filePath
            },
            permissions: [{
                userId: user.id,
                email: user.email,
                access: 'owner',
                grantedAt: new Date()
            }],
            metadata: {
                uploadDate: stat.birthtime,
                lastAccessed: new Date(),
                lastModified: stat.mtime
            },
            isPublic: false,
            conversionStatus: 'none',
            isLocalFile: true
        };

        const docRef = await db.collection('mediaFiles').add(fileData);
        
        console.log(`✅ Registrado archivo local: ${filename}`);
        
        return {
            id: docRef.id,
            ...fileData
        };
    }

    getMimeType(filename, fileType) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            audio: {
                mp3: 'audio/mpeg',
                wav: 'audio/wav',
                flac: 'audio/flac',
                ogg: 'audio/ogg',
                m4a: 'audio/mp4',
                aac: 'audio/aac'
            },
            video: {
                mp4: 'video/mp4',
                avi: 'video/x-msvideo',
                mkv: 'video/x-matroska',
                mov: 'video/quicktime',
                webm: 'video/webm'
            }
        };

        return mimeTypes[fileType]?.[ext] || `${fileType}/${ext}`;
    }

    async getLocalFileStream(fileType, filename) {
        const filePath = path.join(this.basePath, fileType, filename);
        
        console.log(`📁 Buscando archivo en: ${filePath}`);
        
        if (!await fs.pathExists(filePath)) {
            // Intentar en la carpeta converted si no se encuentra
            const convertedPath = path.join(this.basePath, 'converted', filename);
            if (await fs.pathExists(convertedPath)) {
                console.log(`✅ Encontrado en converted: ${convertedPath}`);
                return fs.createReadStream(convertedPath);
            }
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }

        console.log(`✅ Archivo encontrado: ${filePath}`);
        return fs.createReadStream(filePath);
    }
}

module.exports = new LocalFileScanner();