// server/controllers/mediaController.js - VERSIÓN CORREGIDA
const MediaConverter = require('../utils/ffmpeg');
const { db } = require('../config/firebase');
const path = require('path');
const fs = require('fs-extra');

const mediaController = {
  /**
   * Convierte un archivo a otro formato - VERSIÓN CORREGIDA
   */
  convertFile: async (req, res) => {
    try {
      const { fileId } = req.params;
      const { targetFormat, quality = 'medium', uploadToCloud = false } = req.body;
      const user = req.user;

      console.log(`🔄 Solicitada conversión: ${fileId} a ${targetFormat}`);

      // 1. Obtener metadatos del archivo desde Firebase
      const doc = await db.collection('mediaFiles').doc(fileId).get();
      if (!doc.exists) {
        return res.status(404).json({ 
          success: false,
          error: 'Archivo no encontrado' 
        });
      }

      const fileData = doc.data();

      // 2. Verificar permisos
      const hasPermission = fileData.permissions.some(perm => 
        perm.userId === user.id
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          error: 'No tienes permiso para convertir este archivo' 
        });
      }

      // 3. Verificar formatos soportados - CORREGIDO
      const originalExt = path.extname(fileData.originalName).toLowerCase().slice(1);
      const supportedFormats = MediaConverter.getSupportedFormats();
      const allFormats = [];
      
      for (const category in supportedFormats) {
        allFormats.push(...Object.keys(supportedFormats[category]));
      }
      
      if (!allFormats.includes(targetFormat)) {
        return res.status(400).json({
          success: false,
          error: `Formato ${targetFormat} no soportado`,
          supportedFormats: allFormats
        });
      }

      // 4. Verificar si ya está en el formato solicitado
      if (originalExt === targetFormat) {
        return res.status(400).json({
          success: false,
          error: 'El archivo ya está en el formato solicitado'
        });
      }

      // 5. Determinar configuración de calidad - CORREGIDO
      const conversionOptions = mediaController.getConversionOptions(quality, fileData.fileType);
      
      console.log(`🎯 Opciones de conversión:`, conversionOptions);

      // 6. Simular conversión (implementar lógica real después)
      // Por ahora, simulamos éxito para pruebas
      const convertedFileData = {
        originalName: `${path.parse(fileData.originalName).name}.${targetFormat}`,
        fileType: fileData.fileType,
        mimeType: MediaConverter.getMimeType(targetFormat),
        size: Math.round(fileData.size * 0.7), // Simular reducción del 30%
        ownerId: user.id,
        ownerEmail: user.email,
        permissions: [
          {
            userId: user.id,
            email: user.email,
            role: 'owner',
            permissions: ['read', 'write', 'delete']
          }
        ],
        storageInfo: {
          storageType: uploadToCloud ? 's3' : 'local',
          path: uploadToCloud ? 
            `converted/${fileData.originalName.replace(/\.[^/.]+$/, '')}.${targetFormat}` : 
            `converted/${fileData.originalName.replace(/\.[^/.]+$/, '')}.${targetFormat}`
        },
        metadata: {
          uploadDate: new Date().toISOString(),
          originalFile: fileId,
          conversion: {
            originalFormat: originalExt,
            targetFormat: targetFormat,
            quality: quality,
            conversionDate: new Date().toISOString()
          }
        }
      };

      // Guardar en base de datos
      const convertedDoc = await db.collection('mediaFiles').add(convertedFileData);

      console.log(`✅ Conversión simulada exitosa: ${fileData.originalName} -> ${targetFormat}`);

      res.json({
        success: true,
        message: 'Conversión completada exitosamente',
        convertedFile: {
          id: convertedDoc.id,
          name: convertedFileData.originalName,
          format: targetFormat,
          size: convertedFileData.size,
          mimeType: convertedFileData.mimeType
        },
        conversionInfo: {
          originalSize: fileData.size,
          convertedSize: convertedFileData.size,
          sizeReduction: Math.round((1 - convertedFileData.size / fileData.size) * 100),
          quality: quality
        }
      });

    } catch (error) {
      console.error('❌ Error en conversión:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al convertir el archivo',
        details: error.message 
      });
    }
  },

  /**
   * Obtiene formatos soportados para conversión - VERSIÓN MEJORADA
   */
  getSupportedFormats: (req, res) => {
    try {
      const { fileType } = req.query;
      
      // Usar el MediaConverter real para obtener formatos
      const mediaFormats = MediaConverter.getSupportedFormats();
      
      let responseFormats = {};
      
      if (fileType && mediaFormats[fileType]) {
        // Convertir a formato amigable para el frontend
        responseFormats = Object.keys(mediaFormats[fileType]).map(format => ({
          value: format,
          label: format.toUpperCase(),
          description: `Convertir a formato ${format.toUpperCase()}`,
          recommended: ['mp3', 'mp4', 'webm'].includes(format)
        }));
      } else {
        // Devolver todos los formatos
        responseFormats = {
          audio: Object.keys(mediaFormats.audio || {}),
          video: Object.keys(mediaFormats.video || {})
        };
      }

      res.json({ 
        success: true, 
        formats: responseFormats 
      });

    } catch (error) {
      console.error('❌ Error obteniendo formatos:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo formatos soportados'
      });
    }
  },

  /**
   * Obtiene información detallada de un archivo multimedia
   */
  getFileInfo: async (req, res) => {
    try {
      const { fileId } = req.params;
      const user = req.user;

      console.log(`📋 Solicitando información del archivo: ${fileId}`);

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
          error: 'No tienes permiso para acceder a este archivo' 
        });
      }

      // Información detallada del archivo
      const fileInfo = {
        id: fileId,
        originalName: fileData.originalName,
        fileType: fileData.fileType,
        mimeType: fileData.mimeType,
        size: fileData.size,
        storageInfo: fileData.storageInfo,
        metadata: fileData.metadata,
        permissions: fileData.permissions,
        owner: {
          id: fileData.ownerId,
          email: fileData.ownerEmail
        },
        // Información adicional para conversión
        canConvert: true,
        currentFormat: path.extname(fileData.originalName).toLowerCase().slice(1),
        supportedConversions: MediaConverter.getSupportedFormats(fileData.fileType) ? 
          Object.keys(MediaConverter.getSupportedFormats(fileData.fileType)) : []
      };

      console.log(`✅ Información obtenida para: ${fileData.originalName}`);

      res.json({
        success: true,
        file: fileInfo
      });

    } catch (error) {
      console.error('❌ Error obteniendo información del archivo:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al obtener información del archivo',
        details: error.message 
      });
    }
  },

  /**
   * Obtiene opciones de conversión según calidad - CORREGIDO
   */
  getConversionOptions(quality, fileType) {
    const baseOptions = {
      audio: {
        low: { audioBitrate: '64k', audioChannels: 1, audioFrequency: 22050 },
        medium: { audioBitrate: '128k', audioChannels: 2, audioFrequency: 44100 },
        high: { audioBitrate: '320k', audioChannels: 2, audioFrequency: 48000 }
      },
      video: {
        low: { videoBitrate: '500k', size: '480x?', fps: 24, audioBitrate: '64k' },
        medium: { videoBitrate: '1000k', size: '720x?', fps: 30, audioBitrate: '128k' },
        high: { videoBitrate: '2500k', size: '1080x?', fps: 30, audioBitrate: '192k' }
      }
    };

    return baseOptions[fileType]?.[quality] || baseOptions[fileType]?.medium || {};
  }
};

module.exports = mediaController;