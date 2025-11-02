// server/routes/files.js - VERSIÓN CORREGIDA COMPLETA
const express = require('express');
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const S3Sync = require('../scripts/syncS3Files');
const { db } = require('../config/firebase');

const router = express.Router();

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

// Rutas de archivos
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/my-files', fileController.getUserFiles);
router.get('/info/:fileId', fileController.getFileInfo);
router.get('/test-storage', fileController.testStorage);
router.get('/all', fileController.getAllFiles);
router.post('/:fileId/download-to-local', fileController.downloadToLocal);
router.post('/:fileId/upload-to-cloud', fileController.uploadToCloud);

// RUTA DE SINCRONIZACIÓN CORREGIDA
router.post('/sync-s3', async (req, res) => {
  try {
    const user = req.user;
    
    // ✅ VERIFICAR QUE EL USUARIO EXISTA
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

// ENDPOINT DEBUG CORREGIDO
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

module.exports = router;