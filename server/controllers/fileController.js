// server/controllers/fileController.js
const storageManager = require('../utils/storage');
const { db } = require('../config/firebase');

class FileController {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
            }

            const user = req.user;
            const { originalname, buffer, mimetype, size } = req.file;

            // Determinar tipo de archivo
            const fileType = mimetype.split('/')[0];
            const allowedTypes = ['audio', 'video', 'image'];
            
            if (!allowedTypes.includes(fileType)) {
                return res.status(400).json({ 
                    error: 'Tipo de archivo no soportado. Solo audio, video e imágenes.' 
                });
            }

            // Subir archivo al almacenamiento
            const uploadResult = await storageManager.uploadFile(buffer, originalname, fileType);

            // Guardar metadatos en Firebase
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
                conversionStatus: 'none' // none, processing, completed, failed
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
            const { type } = req.query; // audio, video, image

            let query = db.collection('mediaFiles')
                .where('ownerId', '==', user.id);

            if (type) {
                query = query.where('fileType', '==', type);
            }

            const snapshot = await query.orderBy('metadata.uploadDate', 'desc').get();
            const files = [];

            snapshot.forEach(doc => {
                files.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.json({
                success: true,
                files: files,
                count: files.length
            });

        } catch (error) {
            console.error('❌ Error obteniendo archivos:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error obteniendo archivos' 
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

            // Verificar permisos
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

    // Método para obtener TODOS los archivos (locales y en la nube)
    async getAllUserFiles(req, res) {
        try {
            const user = req.user;
            const { includeLocal = 'true', includeCloud = 'true' } = req.query;

            // Archivos en Firebase (metadatos)
            let query = db.collection('mediaFiles').where('ownerId', '==', user.id);
            const snapshot = await query.orderBy('metadata.uploadDate', 'desc').get();
            
            const files = [];
            snapshot.forEach(doc => {
            const fileData = doc.data();
            
            // Filtrar según lo solicitado
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
            error: 'Error obteniendo archivos' 
            });
        }
    }

    async downloadToLocal(req, res) {
        try {
            const { fileId } = req.params;
            const user = req.user;

            // Obtener metadatos del archivo
            const doc = await db.collection('mediaFiles').doc(fileId).get();
            if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const fileData = doc.data();

            // Verificar permisos
            const hasPermission = fileData.permissions.some(perm => 
            perm.userId === user.id
            );
            if (!hasPermission) {
            return res.status(403).json({ error: 'Sin permisos para este archivo' });
            }

            // Solo se puede descargar a local si está en la nube
            if (fileData.storageInfo?.storageType !== 's3') {
            return res.status(400).json({ error: 'El archivo no está en la nube' });
            }

            // Descargar de S3
            const s3File = await storageManager.getFile(fileData.storageInfo.path);
            
            // Guardar localmente
            const localPath = await storageManager.saveToLocal(
            s3File.Body, 
            fileData.originalName,
            fileData.fileType
            );

            // Actualizar metadatos para indicar que ahora está local
            await db.collection('mediaFiles').doc(fileId).update({
            'storageInfo.storageType': 'local',
            'storageInfo.localPath': localPath.path,
            'storageInfo.url': localPath.url,
            'metadata.lastAccessed': new Date(),
            'metadata.localCopy': true
            });

            res.json({
            success: true,
            message: 'Archivo descargado a almacenamiento local',
            file: {
                id: doc.id,
                ...fileData,
                storageInfo: {
                ...fileData.storageInfo,
                storageType: 'local',
                localPath: localPath.path,
                url: localPath.url
                }
            }
            });

        } catch (error) {
            console.error('❌ Error descargando a local:', error);
            res.status(500).json({ 
            success: false,
            error: 'Error descargando archivo a local' 
            });
        }
        }

        // Método para subir archivo local a la nube
        async uploadToCloud(req, res) {
        try {
            const { fileId } = req.params;
            const user = req.user;

            // Obtener metadatos del archivo
            const doc = await db.collection('mediaFiles').doc(fileId).get();
            if (!doc.exists) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
            }

            const fileData = doc.data();

            // Verificar permisos y que sea local
            const hasPermission = fileData.permissions.some(perm => 
            perm.userId === user.id
            );
            if (!hasPermission || fileData.storageInfo?.storageType !== 'local') {
            return res.status(400).json({ error: 'Archivo no disponible para subir a la nube' });
            }

            // Leer archivo local
            const localBuffer = fs.readFileSync(fileData.storageInfo.path);
            
            // Subir a S3
            const s3Result = await storageManager.uploadToS3(
            localBuffer,
            fileData.originalName,
            fileData.fileType
            );

            // Actualizar metadatos
            await db.collection('mediaFiles').doc(fileId).update({
            'storageInfo.storageType': 's3',
            'storageInfo.path': s3Result.path,
            'storageInfo.url': s3Result.url,
            'storageInfo.key': s3Result.key,
            'metadata.lastAccessed': new Date(),
            'metadata.uploadedToCloud': new Date()
            });

            // Opcional: eliminar archivo local para ahorrar espacio
            // fs.unlinkSync(fileData.storageInfo.path);

            res.json({
            success: true,
            message: 'Archivo subido a la nube exitosamente',
            file: {
                id: doc.id,
                ...fileData,
                storageInfo: {
                ...fileData.storageInfo,
                storageType: 's3',
                path: s3Result.path,
                url: s3Result.url,
                key: s3Result.key
                }
            }
            });

        } catch (error) {
            console.error('❌ Error subiendo a la nube:', error);
            res.status(500).json({ 
            success: false,
            error: 'Error subiendo archivo a la nube' 
            });
        }
        }

    async testStorage(req, res) {
        try {
            const testResult = await storageManager.testS3Connection();
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