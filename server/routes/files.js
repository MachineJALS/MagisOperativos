// server/routes/files.js - VERSIÓN COMPLETA CORREGIDA
const express = require('express');
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const S3Sync = require('../scripts/syncS3Files');
const { db } = require('../config/firebase');
const AWS = require('aws-sdk');

const router = express.Router();

// Configurar S3 para URLs firmadas
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Configurar multer para subida de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB límite
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac',
            'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
            'image/jpeg', 'image/png', 'image/gif'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// Aplicar autenticación a todas las rutas
router.use(authenticateJWT);

// =============================================
// RUTAS PRINCIPALES EXISTENTES
// =============================================

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/my-files', fileController.getUserFiles);
router.get('/info/:fileId', fileController.getFileInfo);
router.get('/test-storage', fileController.testStorage);
router.get('/all', fileController.getAllFiles);
router.post('/:fileId/download-to-local', fileController.downloadToLocal);
router.post('/:fileId/upload-to-cloud', fileController.uploadToCloud);

// =============================================
// NUEVOS ENDPOINTS PARA URLs FIRMADAS S3
// =============================================

/**
 * Obtener URL firmada para reproducción/streaming
 * Válida por 1 hora
 */
router.get('/signed-url/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    console.log(`🔐 Solicitando URL firmada para archivo: ${fileId}, usuario: ${user.email}`);

    // Obtener metadatos del archivo
    const doc = await db.collection('mediaFiles').doc(fileId).get();
    if (!doc.exists) {
      console.log(`❌ Archivo no encontrado: ${fileId}`);
      return res.status(404).json({ 
        success: false,
        error: 'Archivo no encontrado' 
      });
    }

    const fileData = doc.data();

    // Verificar permisos
    const hasPermission = fileData.permissions.some(perm => 
      perm.userId === user.id
    );

    if (!hasPermission) {
      console.log(`❌ Sin permisos para archivo: ${fileId}, usuario: ${user.email}`);
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permiso para acceder a este archivo' 
      });
    }

    // Solo generar URL firmada para archivos en S3
    if (fileData.storageInfo?.storageType !== 's3') {
      console.log(`❌ Archivo no está en S3: ${fileId}`);
      return res.status(400).json({
        success: false,
        error: 'El archivo no está almacenado en S3'
      });
    }

    const s3Key = fileData.storageInfo.path;
    const expiresIn = 3600; // 1 hora en segundos

    console.log(`🔑 Generando URL firmada para: ${s3Key}`);

    // Generar URL firmada
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn,
      ResponseContentDisposition: 'inline' // Para reproducción en navegador
    });

    console.log(`✅ URL firmada generada para: ${fileData.originalName}`);

    res.json({
      success: true,
      signedUrl: signedUrl,
      fileInfo: {
        id: fileId,
        originalName: fileData.originalName,
        fileType: fileData.fileType,
        mimeType: fileData.mimeType,
        size: fileData.size
      },
      expiresAt: new Date(Date.now() + (expiresIn * 1000)),
      expiresIn: expiresIn
    });

  } catch (error) {
    console.error('❌ Error generando URL firmada:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al generar URL de acceso',
      details: error.message 
    });
  }
});

/**
 * Obtener URL firmada para descarga
 * Válida por 1 hora, fuerza descarga
 */
router.get('/download-url/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    console.log(`📥 Solicitando URL de descarga para archivo: ${fileId}`);

    // Obtener metadatos del archivo
    const doc = await db.collection('mediaFiles').doc(fileId).get();
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Archivo no encontrado' 
      });
    }

    const fileData = doc.data();

    // Verificar permisos
    const hasPermission = fileData.permissions.some(perm => 
      perm.userId === user.id
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permiso para descargar este archivo' 
      });
    }

    // Solo generar URL firmada para archivos en S3
    if (fileData.storageInfo?.storageType !== 's3') {
      return res.status(400).json({
        success: false,
        error: 'El archivo no está almacenado en S3'
      });
    }

    const s3Key = fileData.storageInfo.path;
    const expiresIn = 3600; // 1 hora

    // Generar URL firmada para descarga
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileData.originalName)}"` // Fuerza descarga
    });

    console.log(`✅ URL de descarga generada para: ${fileData.originalName}`);

    res.json({
      success: true,
      downloadUrl: signedUrl,
      fileInfo: {
        id: fileId,
        originalName: fileData.originalName,
        fileType: fileData.fileType,
        size: fileData.size
      },
      expiresAt: new Date(Date.now() + (expiresIn * 1000))
    });

  } catch (error) {
    console.error('❌ Error generando URL de descarga:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al generar URL de descarga',
      details: error.message 
    });
  }
});

// =============================================
// RUTA DE SINCRONIZACIÓN (existente)
// =============================================

router.post('/sync-s3', async (req, res) => {
  try {
    const user = req.user;
    
    if (!user || !user.id || !user.email) {
      console.log('❌ Usuario no autenticado en sync-s3:', user);
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado correctamente'
      });
    }

    console.log('👤 Usuario en sync:', user.email, user.id);
    
    const sync = new S3Sync();
    
    // Sincronizar carpetas específicas
    const moviesResult = await sync.syncFolder('movies/', user.id, user.email);
    const musicResult = await sync.syncFolder('music/', user.id, user.email);
    
    res.json({
      success: true,
      message: 'Sincronización completada',
      results: {
        movies: moviesResult,
        music: musicResult,
        total: {
          synced: moviesResult.synced + musicResult.synced,
          errors: moviesResult.errors + musicResult.errors
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en sincronización S3:', error);
    res.status(500).json({
      success: false,
      error: 'Error en sincronización',
      details: error.message
    });
  }
});

// =============================================
// ENDPOINT DEBUG (existente)
// =============================================

router.get('/debug-firebase', async (req, res) => {
  try {
    const user = req.user;
    console.log('👤 Usuario debug:', user?.email);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const snapshot = await db.collection('mediaFiles').get();
    const allFiles = [];
    
    snapshot.forEach(doc => {
      allFiles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Archivos del usuario actual
    const userFiles = allFiles.filter(file => file.ownerId === user.id);
    
    console.log('📊 ESTADO DE FIREBASE:');
    console.log(`   Total archivos en Firebase: ${allFiles.length}`);
    console.log(`   Archivos del usuario ${user.email}: ${userFiles.length}`);
    
    userFiles.forEach(file => {
      console.log(`   - ${file.originalName} (${file.fileType}) - ${file.storageInfo?.storageType}`);
    });

    res.json({
      success: true,
      stats: {
        totalInFirebase: allFiles.length,
        userFiles: userFiles.length,
        userFilesList: userFiles.map(f => ({
          name: f.originalName,
          type: f.fileType,
          storage: f.storageInfo?.storageType,
          synced: f.metadata?.syncedFromS3 || false
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error en debug-firebase:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// ENDPOINT PARA ESCANEAR STORAGE LOCAL
// =============================================

router.post('/scan-storage', authenticateJWT, async (req, res) => {
  try {
    const scanner = require('../services/storageScanner');
    const results = await scanner.scanAndSync();
    
    res.json({
      success: true,
      message: 'Escaneo de storage completado',
      results: results
    });
  } catch (error) {
    console.error('Error escaneando storage:', error);
    res.status(500).json({
      success: false,
      error: 'Error escaneando storage local'
    });
  }
});

// =============================================
// ⚠️ NO AGREGAR MÁS RUTAS AQUÍ - ELIMINAR LAS RUTAS DUPLICADAS
// =============================================

module.exports = router;