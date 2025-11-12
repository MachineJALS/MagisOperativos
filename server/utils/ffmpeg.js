// server/utils/ffmpeg.js - VERSIÓN CORREGIDA Y COMPATIBLE
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs-extra');

ffmpeg.setFfmpegPath(ffmpegPath);

class MediaConverter {
  constructor() {
    this.supportedFormats = {
      audio: {
        mp3: { codec: 'libmp3lame', extension: 'mp3', mimeType: 'audio/mpeg' },
        wav: { codec: 'pcm_s16le', extension: 'wav', mimeType: 'audio/wav' },
        flac: { codec: 'flac', extension: 'flac', mimeType: 'audio/flac' },
        aac: { codec: 'aac', extension: 'aac', mimeType: 'audio/aac' },
        ogg: { codec: 'libvorbis', extension: 'ogg', mimeType: 'audio/ogg' },
        m4a: { codec: 'aac', extension: 'm4a', mimeType: 'audio/mp4' }
      },
      video: {
        mp4: { codec: 'libx264', extension: 'mp4', mimeType: 'video/mp4' },
        webm: { codec: 'libvpx', extension: 'webm', mimeType: 'video/webm' },
        avi: { codec: 'mpeg4', extension: 'avi', mimeType: 'video/x-msvideo' },
        mov: { codec: 'libx264', extension: 'mov', mimeType: 'video/quicktime' },
        mkv: { codec: 'libx264', extension: 'mkv', mimeType: 'video/x-matroska' }
      }
    };
  }

  // ✅ MÉTODOS ESTÁTICOS CORREGIDOS para compatibilidad con mediaController.js
  static getSupportedFormats(fileType = null) {
    const instance = new MediaConverter();
    if (fileType && instance.supportedFormats[fileType]) {
      return instance.supportedFormats[fileType];
    }
    return instance.supportedFormats;
  }

  static getMimeType(extension) {
    const instance = new MediaConverter();
    
    // Buscar en todos los formatos
    for (const category in instance.supportedFormats) {
      for (const format in instance.supportedFormats[category]) {
        if (instance.supportedFormats[category][format].extension === extension) {
          return instance.supportedFormats[category][format].mimeType;
        }
      }
    }
    
    return 'application/octet-stream';
  }

  static canConvert(fromFormat, toFormat) {
    const instance = new MediaConverter();
    const allFormats = [];
    
    for (const category in instance.supportedFormats) {
      allFormats.push(...Object.keys(instance.supportedFormats[category]));
    }
    
    return allFormats.includes(fromFormat) && allFormats.includes(toFormat);
  }

  /**
   * Convierte un archivo multimedia - VERSIÓN MEJORADA
   */
  async convertFile(inputPath, outputPath, targetFormat, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`🔄 Iniciando conversión: ${inputPath} -> ${outputPath}`);

      // ✅ Asegurar que el directorio de salida existe
      const outputDir = path.dirname(outputPath);
      fs.ensureDirSync(outputDir);

      let command = ffmpeg(inputPath);

      // Configurar según el formato de destino
      const formatConfig = this.getFormatConfig(targetFormat);
      if (formatConfig) {
        command = command.toFormat(targetFormat);
      }

      // Configurar opciones de audio
      if (options.audioBitrate) {
        command = command.audioBitrate(options.audioBitrate);
      }

      if (options.audioChannels) {
        command = command.audioChannels(options.audioChannels);
      }

      if (options.audioFrequency) {
        command = command.audioFrequency(options.audioFrequency);
      }

      // Configurar opciones de video
      if (options.videoBitrate) {
        command = command.videoBitrate(options.videoBitrate);
      }

      if (options.size) {
        command = command.size(options.size);
      }

      if (options.fps) {
        command = command.fps(options.fps);
      }

      command
        .on('start', (commandLine) => {
          console.log(`🎬 FFmpeg iniciado: ${commandLine}`);
        })
        .on('progress', (progress) => {
          console.log(`📊 Progreso: ${progress.percent}%`);
        })
        .on('end', () => {
          console.log(`✅ Conversión completada: ${outputPath}`);
          
          // ✅ Verificar que el archivo se creó correctamente
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            resolve({
              success: true,
              outputPath: outputPath,
              format: targetFormat,
              fileSize: stats.size
            });
          } else {
            reject(new Error('El archivo convertido no se creó'));
          }
        })
        .on('error', (err) => {
          console.error(`❌ Error FFmpeg: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
  }

  getFormatConfig(format) {
    // Buscar en todos los formatos
    for (const category in this.supportedFormats) {
      if (this.supportedFormats[category][format]) {
        return this.supportedFormats[category][format];
      }
    }
    return null;
  }

  /**
   * ✅ NUEVO MÉTODO: Obtener información de formatos para el frontend
   */
  static getFormatsForFrontend(fileType = null) {
    const instance = new MediaConverter();
    let formats = [];
    
    if (fileType && instance.supportedFormats[fileType]) {
      formats = Object.keys(instance.supportedFormats[fileType]).map(format => ({
        value: format,
        label: format.toUpperCase(),
        description: `Convertir a formato ${format.toUpperCase()}`,
        recommended: ['mp3', 'mp4', 'webm', 'flac'].includes(format)
      }));
    } else {
      // Devolver todos los formatos
      formats = {
        audio: Object.keys(instance.supportedFormats.audio || {}),
        video: Object.keys(instance.supportedFormats.video || {})
      };
    }
    
    return formats;
  }
}

// ✅ Exportar correctamente para compatibilidad
module.exports = MediaConverter;