// server/controllers/fileController.js - VERSIÓN COMPLETA CORREGIDA
const storageManager = require('../utils/storage');
const { db } = require('../config/firebase');
const fs = require('fs');

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

            // ✅ CONSULTA SIMPLIFICADA TEMPORALMENTE (sin ordenamiento compuesto)
            let query = db.collection('mediaFiles').where('ownerId', '==', user.id);
            const snapshot = await query.get();
            
            const files = [];
            snapshot.forEach(doc => {
                const fileData = doc.data();
                
                // Filtrar por tipo si se especifica
                if (!type || type === 'all' || fileData.fileType === type) {
                    files.push({
                        id: doc.id,
                        ...fileData
                    });
                }
            });

            // ✅ ORDENAR MANUALMENTE EN MEMORIA
            files.sort((a, b) => {
                const dateA = new Date(a.metadata?.uploadDate || 0);
                const dateB = new Date(b.metadata?.uploadDate || 0);
                return dateB - dateA; // Orden descendente
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

            // ✅ CONSULTA SIMPLIFICADA TEMPORALMENTE (sin ordenamiento compuesto)
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

            // ✅ ORDENAR MANUALMENTE EN MEMORIA
            files.sort((a, b) => {
                const dateA = new Date(a.metadata?.uploadDate || 0);
                const dateB = new Date(b.metadata?.uploadDate || 0);
                return dateB - dateA; // Orden descendente
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