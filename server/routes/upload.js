// server/routes/upload.js - NUEVO ARCHIVO
const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const AWSUploader = require('../services/awsUploader');

const router = express.Router();

router.post('/upload-to-s3', authenticateJWT, async (req, res) => {
  try {
    const { localPath, s3Folder = 'uploads' } = req.body;
    
    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere localPath'
      });
    }

    const result = await AWSUploader.uploadLocalFile(localPath, s3Folder);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Archivo subido exitosamente a S3',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error en upload-to-s3:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

router.post('/sync-folder-to-s3', authenticateJWT, async (req, res) => {
  try {
    const { localFolder, s3Folder } = req.body;
    
    if (!localFolder || !s3Folder) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren localFolder y s3Folder'
      });
    }

    const result = await AWSUploader.syncFolderToS3(localFolder, s3Folder);
    
    res.json(result);
  } catch (error) {
    console.error('Error en sync-folder-to-s3:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;