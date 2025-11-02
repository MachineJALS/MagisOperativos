// server/routes/files.js
const express = require('express');
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const S3Sync = require('../scripts/syncS3Files');

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


// Sincronización con S3 al iniciar el servidor
router.post('/sync-s3', authenticateJWT, async (req, res) => {
  try {
    const sync = new S3Sync();
    
    // Sincronizar carpetas específicas
    const moviesCount = await sync.syncFolder('movies/', req.user.id);
    const musicCount = await sync.syncFolder('music/', req.user.id);
    
    res.json({
      success: true,
      message: 'Sincronización completada',
      results: {
        movies: moviesCount,
        music: musicCount,
        total: moviesCount + musicCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en sincronización',
      details: error.message
    });
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
router.get('/:fileId/download-to-local', fileController.downloadToLocal);
router.post('/:fileId/upload-to-cloud', fileController.uploadToCloud);

module.exports = router;