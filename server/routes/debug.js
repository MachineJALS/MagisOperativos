// server/routes/debug.js - NUEVO ARCHIVO
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { db } = require('../config/firebase');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Diagnosticar archivo específico
router.get('/diagnose-file/:fileId', authenticateJWT, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Obtener información de la base de datos
    const doc = await db.collection('mediaFiles').doc(fileId).get();
    if (!doc.exists) {
      return res.json({
        success: false,
        error: 'Archivo no encontrado en base de datos'
      });
    }

    const fileData = doc.data();
    const diagnosis = {
      fileId: fileId,
      databaseInfo: fileData,
      storageCheck: {},
      fileInfo: {}
    };

    // Verificar existencia en storage
    if (fileData.storageInfo.storageType === 'local') {
      const fullPath = path.join(__dirname, '../../storage', fileData.storageInfo.path);
      diagnosis.storageCheck.exists = await fs.pathExists(fullPath);
      diagnosis.storageCheck.path = fullPath;
      
      if (diagnosis.storageCheck.exists) {
        const stats = await fs.stat(fullPath);
        diagnosis.fileInfo.size = stats.size;
        diagnosis.fileInfo.lastModified = stats.mtime;
        diagnosis.fileInfo.permissions = (await fs.access(fullPath)).mode;
      }
    }

    // Verificar integridad del archivo
    if (diagnosis.storageCheck.exists) {
      diagnosis.fileInfo.isReadable = await this.checkFileReadable(fullPath);
    }

    res.json({
      success: true,
      diagnosis: diagnosis
    });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verificar todos los archivos convertidos
router.get('/check-converted-files', authenticateJWT, async (req, res) => {
  try {
    const convertedFiles = await db.collection('mediaFiles')
      .where('metadata.conversion', '!=', null)
      .get();

    const results = [];
    
    for (const doc of convertedFiles.docs) {
      const fileData = doc.data();
      const fullPath = path.join(__dirname, '../../storage', fileData.storageInfo.path);
      const exists = await fs.pathExists(fullPath);
      
      results.push({
        id: doc.id,
        name: fileData.originalName,
        exists: exists,
        path: fileData.storageInfo.path,
        size: fileData.size,
        conversion: fileData.metadata.conversion
      });
    }

    const existingFiles = results.filter(r => r.exists);
    const missingFiles = results.filter(r => !r.exists);

    res.json({
      success: true,
      summary: {
        total: results.length,
        existing: existingFiles.length,
        missing: missingFiles.length
      },
      existingFiles: existingFiles,
      missingFiles: missingFiles
    });

  } catch (error) {
    console.error('Error verificando archivos convertidos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función para verificar si el archivo es legible
async function checkFileReadable(filePath) {
  try {
    await fs.access(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = router;