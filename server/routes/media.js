// server/routes/media.js
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const mediaController = require('../controllers/mediaController');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateJWT);

// Convertir archivo
router.post('/convert/:fileId', mediaController.convertFile);

// Obtener formatos soportados
router.get('/supported-formats', mediaController.getSupportedFormats);

// ELIMINAR esta línea que causa el error:
// router.get('/info/:fileId', mediaController.getFileInfo);

module.exports = router;