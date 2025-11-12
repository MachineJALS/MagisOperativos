// server/routes/nodes.js
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const nodeController = require('../controllers/nodeController');

const router = express.Router();

// Rutas públicas para nodos (sin autenticación)
router.post('/register', nodeController.registerNode);
router.post('/:nodeId/stats', nodeController.updateNodeStats);

// Rutas protegidas para dashboard
router.use(authenticateJWT);
router.get('/stats', nodeController.getSystemStats);
router.post('/distribute-task', nodeController.distributeTask);

module.exports = router;