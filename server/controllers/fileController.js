// server/controllers/fileController.js - VERSIÓN DEFINITIVA CORREGIDA
const storageManager = require('../utils/storage');
const { db } = require('../config/firebase');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// ✅ CORREGIR LA IMPORTACIÓN - debe ser localFileScanner
const localFileScanner = require('../services/localFileScanner');

// ✅ FUNCIONES AUXILIARES DEFINIDAS FUERA DE LA CLASE
const getMimeTypeForFormat = (format, fileType) => {
    const mimeTypes = {
        audio: {
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            flac: 'audio/flac',
            aac: 'audio/aac',
            ogg: 'audio/ogg',
            m4a: 'audio/mp4'
        },
        video: {
            mp4: 'video/mp4',
            webm: 'video/webm',
            avi: 'video/x-msvideo',
            mov: 'video/quicktime',
            mkv: 'video/x-matroska'
        }
    };
    
    return mimeTypes[fileType]?.[format] || 'application/octet-stream';
};

const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
};

class FileController {

    async scanLocalFiles(req, res) {
        try {
            const user = req.user;
            const result = await localFileScanner.scanAndRegisterFiles(user);
            res.json({
                success: true,
                message: `Escaneo completado. ${result.total} archivos encontrados.`,
                ...result
            });
        } catch (error) {
            console.error('❌ Error escaneando archivos locales:', error);
            res.status(500).json({
                success: false,
                error: 'Error escaneando archivos locales',
                details: error.message
            });
        }
    }

    async serveLocalFile(req, res) {
        try {
            const { type, filename } = req.params;
            const user = req.user;

            console.log(`🔍 Sirviendo archivo local: ${type}/${filename} para usuario ${user.email}`);

            // Buscar el archivo en la base de datos
            const fileQuery = await db.collection('mediaFiles')
                .where('fileName', '==', filename)
                .where('ownerId', '==', user.id)
                .get();

            if (fileQuery.empty) {
                console.log(`❌ Archivo no encontrado en BD: ${filename}`);
                return res.status(404).json({ error: 'Archivo no encontrado o sin permisos' });
            }

            const fileData = fileQuery.docs[0].data();
            console.log(`📁 Encontrado en BD: ${fileData.originalName}`);

            // Obtener el stream del archivo
            const stream = await localFileScanner.getLocalFileStream(type, filename);

            // Configurar headers para streaming
            res.setHeader('Content-Type', fileData.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileData.originalName)}"`);
            res.setHeader('Cache-Control', 'no-cache');

            // Manejar errores del stream
            stream.on('error', (error) => {
                console.error('❌ Error en stream:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al leer el archivo' });
                }
            });

            // Pipe del stream a la respuesta
            stream.pipe(res);

        } catch (error) {
            console.error('❌ Error sirviendo archivo local:', error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error accediendo al archivo',
                    details: error.message 
                });
            }
        }
    }

    // ✅ MÉTODO DE CONVERSIÓN REAL SIMPLIFICADO Y FUNCIONAL
    async convertFileReal(req, res) {
        try {
            const { fileId, targetFormat } = req.body;
            const user = req.user;

            console.log(`🔄 Iniciando conversión REAL: ${fileId} -> ${targetFormat}`);

            const doc = await db.collection('mediaFiles').doc(fileId).get();
            if (!doc.exists) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Archivo no encontrado' 
                });
            }

            const originalFile = doc.data();
            const hasPermission = originalFile.permissions.some(perm => 
                perm.userId === user.id
            );
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Sin permisos para este archivo' 
                });
            }

            // ✅ DETECTAR TIPO DE ARCHIVO Y PROCEDER CON CONVERSIÓN REAL
            let conversionResult;
            
            if (originalFile.storageInfo?.storageType === 'local') {
                console.log('🎯 Conversión REAL para archivo local');
                conversionResult = await this.performRealConversion(originalFile, targetFormat, user);
            } else if (originalFile.storageInfo?.storageType === 's3') {
                console.log('🎯 Conversión REAL para archivo en S3');
                conversionResult = await this.performS3Conversion(originalFile, targetFormat, user);
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de almacenamiento no soportado para conversión'
                });
            }

            res.json({
                success: true,
                message: 'Conversión REAL completada exitosamente',
                convertedFile: conversionResult.convertedFile,
                conversionInfo: {
                    type: 'real',
                    originalFormat: conversionResult.originalFormat,
                    targetFormat: targetFormat,
                    originalSize: originalFile.size,
                    convertedSize: conversionResult.convertedSize,
                    reductionPercent: conversionResult.reductionPercent
                }
            });

        } catch (error) {
            console.error('❌ Error en conversión real:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error en proceso de conversión',
                details: error.message
            });
        }
    }

    // ✅ NUEVO MÉTODO: Conversión REAL para archivos en S3
    async performS3Conversion(originalFile, targetFormat, user) {
        return new Promise(async (resolve, reject) => {
            try {
                const originalFilename = originalFile.originalName;
                const originalExt = getFileExtension(originalFilename);
                const baseName = originalFilename.split('.')[0];
                
                const outputFilename = `${baseName}.${targetFormat}`;
                const outputFileId = `conv_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Rutas de archivos temporales
                const tempInputPath = path.join(__dirname, '../../storage/temp', `${outputFileId}_input.${originalExt}`);
                const tempOutputPath = path.join(__dirname, '../../storage/temp', `${outputFileId}_output.${targetFormat}`);
                
                // Asegurar que existen los directorios temporales
                await fs.ensureDir(path.dirname(tempInputPath));
                await fs.ensureDir(path.dirname(tempOutputPath));

                console.log(`🎯 Procesando conversión REAL S3: ${originalExt} -> ${targetFormat}`);

                try {
                    // 1. DESCARGAR archivo de S3
                    console.log(`📥 Descargando desde S3: ${originalFile.storageInfo.path}`);
                    const downloadResult = await storageManager.downloadFile(originalFile.storageInfo.path, tempInputPath);
                    console.log('✅ Descarga completada');

                    // 2. CONVERTIR con FFmpeg
                    await new Promise((ffmpegResolve, ffmpegReject) => {
                        ffmpeg(tempInputPath)
                            .toFormat(targetFormat)
                            .on('start', (commandLine) => {
                                console.log('🚀 FFmpeg iniciado con comando:', commandLine);
                            })
                            .on('progress', (progress) => {
                                console.log(`📊 Progreso: ${progress.percent}%`);
                            })
                            .on('end', async () => {
                                console.log('✅ Conversión FFmpeg completada');
                                ffmpegResolve();
                            })
                            .on('error', (err) => {
                                console.error('❌ Error en FFmpeg:', err);
                                ffmpegReject(err);
                            })
                            .save(tempOutputPath);
                    });

                    // 3. Obtener stats del archivo convertido
                    const outputStats = await fs.stat(tempOutputPath);
                    const convertedSize = outputStats.size;
                    const reductionPercent = Math.round((1 - (convertedSize / originalFile.size)) * 100);

                    // 4. SUBIR archivo convertido a S3
                    const outputBuffer = await fs.readFile(tempOutputPath);
                    const s3Key = `converted/${outputFileId}.${targetFormat}`;
                    
                    console.log(`📤 Subiendo a S3: ${s3Key}`);
                    const uploadResult = await storageManager.uploadFile(outputBuffer, outputFilename, originalFile.fileType, s3Key);
                    console.log('✅ Subida a S3 completada');

                    // 5. Registrar archivo convertido en la base de datos
                    const convertedFileData = {
                        originalName: outputFilename,
                        fileName: `${outputFileId}.${targetFormat}`,
                        ownerId: user.id,
                        ownerEmail: user.email,
                        fileType: originalFile.fileType,
                        mimeType: getMimeTypeForFormat(targetFormat, originalFile.fileType),
                        size: convertedSize,
                        storageInfo: {
                            storageType: 's3',
                            path: s3Key,
                            url: uploadResult.url,
                            requiresSignedUrl: true
                        },
                        permissions: [{
                            userId: user.id,
                            email: user.email,
                            access: 'owner',
                            grantedAt: new Date()
                        }],
                        metadata: {
                            uploadDate: new Date(),
                            lastAccessed: new Date(),
                            convertedFrom: originalFile.id,
                            originalFormat: originalExt,
                            targetFormat: targetFormat,
                            conversionDate: new Date(),
                            conversionType: 'real',
                            originalFileSize: originalFile.size,
                            convertedFileSize: convertedSize,
                            sizeReduction: reductionPercent,
                            note: 'Archivo convertido REAL - Existe físicamente en S3'
                        },
                        isPublic: false,
                        conversionStatus: 'completed',
                        isConvertedFile: true
                    };

                    const docRef = await db.collection('mediaFiles').add(convertedFileData);

                    // 6. Limpiar archivos temporales
                    await fs.remove(tempInputPath).catch(() => console.log('⚠️ No se pudo eliminar temp input'));
                    await fs.remove(tempOutputPath).catch(() => console.log('⚠️ No se pudo eliminar temp output'));

                    console.log(`✅ Conversión REAL S3 completada: ${outputFilename}`);
                    console.log(`📊 Reducción de tamaño: ${reductionPercent}%`);

                    resolve({
                        convertedFile: {
                            id: docRef.id,
                            name: outputFilename,
                            format: targetFormat,
                            size: convertedSize,
                            url: convertedFileData.storageInfo.url,
                            originalName: originalFile.originalName,
                            sizeReduction: reductionPercent,
                            requiresSignedUrl: true
                        },
                        originalFormat: originalExt,
                        convertedSize: convertedSize,
                        reductionPercent: reductionPercent
                    });

                } finally {
                    // Limpieza de archivos temporales en caso de error
                    await fs.remove(tempInputPath).catch(() => {});
                    await fs.remove(tempOutputPath).catch(() => {});
                }

            } catch (error) {
                reject(error);
            }
        });
    }

    // ✅ MÉTODOS ADICIONALES REQUERIDOS POR LAS RUTAS
    async getSignedUrl(req, res) {
        try {
            const { fileId } = req.params;
            res.json({
                success: true,
                url: `/api/files/info/${fileId}`
            });
        } catch (error) {
            console.error('Error generando URL firmada:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error generando URL' 
            });
        }
    }

    async getDownloadUrl(req, res) {
        try {
            const { fileId } = req.params;
            res.json({
                success: true,
                url: `/api/files/info/${fileId}`
            });
        } catch (error) {
            console.error('Error generando URL de descarga:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error generando URL de descarga' 
            });
        }
    }

    async syncS3(req, res) {
        try {
            res.json({
                success: true,
                message: 'Sincronización S3 en desarrollo'
            });
        } catch (error) {
            console.error('Error en sync S3:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error en sincronización S3' 
            });
        }
    }

    // ... (mantener todos los otros métodos existentes: uploadFile, getUserFiles, etc.)
    // [Aquí van todos los otros métodos que ya tenías...]
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
            }

            const user = req.user;
            const { originalname, buffer, mimetype, size } = req.file;

            const fileType = mimetype.split('/')[0];
            const allowedTypes = ['audio', 'video', 'image'];
            
            if (!allowedTypes.includes(fileType)) {
                return res.status(400).json({ 
                    error: 'Tipo de archivo no soportado. Solo audio, video e imágenes.' 
                });
            }

            const uploadResult = await storageManager.uploadFile(buffer, originalname, fileType);

            const mediaData = {
                originalName: originalname,
                fileName: uploadResult.path.split('/').pop(),
                ownerId: user.id,
                ownerEmail: user.email,
                fileType: fileType,
                mimeType: mimetype,
                size: size,
                storageInfo: uploadResult,
                permissions: [{
                    userId: user.id,
                    email: user.email,
                    access: 'owner',
                    grantedAt: new Date()
                }],
                metadata: {
                    uploadDate: new Date(),
                    lastAccessed: new Date()
                },
                isPublic: false,
                conversionStatus: 'none'
            };

            const docRef = await db.collection('mediaFiles').add(mediaData);

            res.status(201).json({
                success: true,
                message: 'Archivo subido correctamente',
                file: {
                    id: docRef.id,
                    ...mediaData,
                    downloadUrl: uploadResult.url
                }
            });

        } catch (error) {
            console.error('❌ Error subiendo archivo:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor al subir el archivo',
                details: error.message 
            });
        }
    }

    async getUserFiles(req, res) {
        try {
            const user = req.user;
            
            if (!user || !user.id) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuario no autenticado' 
                });
            }

            const { type } = req.query;

            console.log('📥 Obteniendo archivos para:', user.email, 'tipo:', type);

            let query = db.collection('mediaFiles').where('ownerId', '==', user.id);
            const snapshot = await query.get();
            
            const files = [];
            snapshot.forEach(doc => {
                const fileData = doc.data();
                
                if (!type || type === 'all' || fileData.fileType === type) {
                    files.push({
                        id: doc.id,
                        ...fileData
                    });
                }
            });

            files.sort((a, b) => {
                const dateA = new Date(a.metadata?.uploadDate || 0);
                const dateB = new Date(b.metadata?.uploadDate || 0);
                return dateB - dateA;
            });

            console.log(`✅ Encontrados ${files.length} archivos para ${user.email}`);

            res.json({
                success: true,
                files: files,
                count: files.length
            });

        } catch (error) {
            console.error('❌ Error obteniendo archivos:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error obteniendo archivos',
                details: error.message 
            });
        }
    }

    async getFileInfo(req, res) {
        try {
            const { fileId } = req.params;
            const user = req.user;

            const doc = await db.collection('mediaFiles').doc(fileId).get();
            
            if (!doc.exists) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const fileData = doc.data();

            const hasPermission = fileData.permissions.some(perm => 
                perm.userId === user.id
            );

            if (!hasPermission) {
                return res.status(403).json({ error: 'No tienes permiso para acceder a este archivo' });
            }

            res.json({
                success: true,
                file: {
                    id: doc.id,
                    ...fileData
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo información del archivo:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    async getAllFiles(req, res) {
        try {
            const user = req.user;
            
            if (!user || !user.id) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuario no autenticado' 
                });
            }

            const { includeLocal = 'true', includeCloud = 'true' } = req.query;

            console.log('📥 Obteniendo archivos para:', user.email);

            const snapshot = await db.collection('mediaFiles')
                .where('ownerId', '==', user.id)
                .get();
            
            const files = [];
            snapshot.forEach(doc => {
                const fileData = doc.data();
                
                const isLocal = fileData.storageInfo?.storageType === 'local';
                const isCloud = fileData.storageInfo?.storageType === 's3';
                
                if ((includeLocal === 'true' && isLocal) || (includeCloud === 'true' && isCloud)) {
                    files.push({
                        id: doc.id,
                        ...fileData,
                        canDownload: true,
                        canUploadToCloud: isLocal,
                        canDownloadToLocal: isCloud
                    });
                }
            });

            files.sort((a, b) => {
                const dateA = new Date(a.metadata?.uploadDate || 0);
                const dateB = new Date(b.metadata?.uploadDate || 0);
                return dateB - dateA;
            });

            console.log(`✅ Encontrados ${files.length} archivos para ${user.email}`);

            res.json({
                success: true,
                files: files,
                counts: {
                    total: files.length,
                    local: files.filter(f => f.storageInfo?.storageType === 'local').length,
                    cloud: files.filter(f => f.storageInfo?.storageType === 's3').length
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo archivos:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error obteniendo archivos',
                details: error.message 
            });
        }
    }

    async downloadToLocal(req, res) {
        try {
            const { fileId } = req.params;
            const user = req.user;

            const doc = await db.collection('mediaFiles').doc(fileId).get();
            if (!doc.exists) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const fileData = doc.data();

            const hasPermission = fileData.permissions.some(perm => 
                perm.userId === user.id
            );
            if (!hasPermission) {
                return res.status(403).json({ error: 'Sin permisos para este archivo' });
            }

            res.json({
                success: true,
                message: 'Funcionalidad de descarga a local en desarrollo',
                file: fileData
            });

        } catch (error) {
            console.error('❌ Error en downloadToLocal:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error en descarga local' 
            });
        }
    }

    async uploadToCloud(req, res) {
        try {
            const { fileId } = req.params;
            const user = req.user;

            const doc = await db.collection('mediaFiles').doc(fileId).get();
            if (!doc.exists) {
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const fileData = doc.data();

            const hasPermission = fileData.permissions.some(perm => 
                perm.userId === user.id
            );
            if (!hasPermission) {
                return res.status(400).json({ error: 'Sin permisos para este archivo' });
            }

            res.json({
                success: true,
                message: 'Funcionalidad de subida a nube en desarrollo',
                file: fileData
            });

        } catch (error) {
            console.error('❌ Error en uploadToCloud:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error subiendo a la nube' 
            });
        }
    }

    async testStorage(req, res) {
        try {
            const testResult = await storageManager.testConnection();
            res.json(testResult);
        } catch (error) {
            res.status(500).json({ 
                connected: false, 
                message: `Error: ${error.message}` 
            });
        }
    }
}

module.exports = new FileController();