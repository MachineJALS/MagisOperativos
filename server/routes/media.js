// server/routes/media.js - VERSIÓN CORREGIDA
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

// ✅ ELIMINAR LA LÍNEA COMENTADA QUE CAUSABA EL ERROR
// router.get('/info/:fileId', mediaController.getFileInfo);

module.exports = router;