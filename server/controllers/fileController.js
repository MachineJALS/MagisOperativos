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