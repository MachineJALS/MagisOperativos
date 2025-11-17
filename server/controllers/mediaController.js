// server/controllers/mediaController.js - VERSIÓN ACTUALIZADA
const MediaConverter = require('../utils/ffmpeg');
const { db } = require('../config/firebase');
const path = require('path');
const fs = require('fs-extra');

// Función auxiliar para determinar carpetas
const getStorageFolder = (fileType, isConverted = false) => {
  if (isConverted) return 'converted';
  switch (fileType) {
    case 'audio': return 'audio';
    case 'video': return 'video';
    case 'image': return 'images';
    default: return 'uploads';
  }
};

const mediaController = {
  /**
   * Convierte un archivo a otro formato - VERSIÓN MEJORADA
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

      // 3. Verificar formatos soportados
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

      // 5. Determinar rutas de archivo
      const inputFolder = getStorageFolder(fileData.fileType);
      const inputPath = path.join(__dirname, '../../storage', inputFolder, path.basename(fileData.storageInfo.path));
      
      const outputFolder = 'converted';
      const outputFileName = `${path.parse(fileData.originalName).name}.${targetFormat}`;
      const outputPath = path.join(__dirname, '../../storage', outputFolder, outputFileName);

      // ✅ Asegurar que existe el directorio converted
      await fs.ensureDir(path.dirname(outputPath));

      console.log(`📁 Rutas de conversión:`);
      console.log(`   Entrada: ${inputPath}`);
      console.log(`   Salida: ${outputPath}`);

      // 6. Verificar que el archivo de entrada existe
      if (!await fs.pathExists(inputPath)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo original no encontrado en el almacenamiento local'
        });
      }

      // 7. Determinar configuración de calidad
      const conversionOptions = mediaController.getConversionOptions(quality, fileData.fileType);
      
      console.log(`🎯 Opciones de conversión:`, conversionOptions);

      try {
        // 8. Realizar conversión REAL
        const conversionResult = await MediaConverter.convertFile(inputPath, outputPath, targetFormat, conversionOptions);
        
        console.log(`✅ Conversión exitosa: ${conversionResult.fileSize} bytes`);

        // 9. Crear datos del archivo convertido
        const convertedFileData = {
          originalName: outputFileName,
          fileType: fileData.fileType,
          mimeType: MediaConverter.getMimeType(targetFormat),
          size: conversionResult.fileSize,
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
            storageType: 'local',
            path: `${outputFolder}/${outputFileName}`
          },
          metadata: {
            uploadDate: new Date().toISOString(),
            originalFile: fileId,
            conversion: {
              originalFormat: originalExt,
              targetFormat: targetFormat,
              quality: quality,
              conversionDate: new Date().toISOString(),
              processingTime: conversionResult.processingTime || 0
            }
          }
        };

        // 10. Guardar en base de datos
        const convertedDoc = await db.collection('mediaFiles').add(convertedFileData);

        // 11. Subir a S3 si se solicitó
        if (uploadToCloud) {
          try {
            const AWSUploader = require('../services/awsUploader');
            const uploadResult = await AWSUploader.uploadLocalFile(convertedFileData.storageInfo.path, 'converted');
            
            if (uploadResult.success) {
              await db.collection('mediaFiles').doc(convertedDoc.id).update({
                'storageInfo.storageType': 's3',
                'storageInfo.s3Key': uploadResult.key,
                'storageInfo.s3Url': uploadResult.location
              });
              console.log(`☁️  Archivo convertido subido a S3: ${uploadResult.key}`);
            }
          } catch (uploadError) {
            console.error('⚠️  Error subiendo a S3:', uploadError);
            // No fallar la conversión solo por error en S3
          }
        }

        res.json({
          success: true,
          message: 'Conversión completada exitosamente',
          convertedFile: {
            id: convertedDoc.id,
            name: convertedFileData.originalName,
            format: targetFormat,
            size: convertedFileData.size,
            mimeType: convertedFileData.mimeType,
            storageType: uploadToCloud ? 's3' : 'local'
          },
          conversionInfo: {
            originalSize: fileData.size,
            convertedSize: convertedFileData.size,
            sizeReduction: Math.round((1 - convertedFileData.size / fileData.size) * 100),
            quality: quality
          }
        });

      } catch (conversionError) {
        console.error('❌ Error en conversión FFmpeg:', conversionError);
        
        // Limpiar archivo de salida si existe
        if (await fs.pathExists(outputPath)) {
          await fs.remove(outputPath);
        }
        
        throw conversionError;
      }

    } catch (error) {
      console.error('❌ Error en conversión:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor al convertir el archivo',
        details: error.message 
      });
    }
  },

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