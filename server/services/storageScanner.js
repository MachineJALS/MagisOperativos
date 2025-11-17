// server/services/storageScanner.js
const fs = require('fs-extra');
const path = require('path');
const { db } = require('../config/firebase');

class StorageScanner {
  constructor() {
    this.baseStoragePath = path.join(__dirname, '../../storage');
    this.folders = ['audio', 'video', 'converted', 'images', 'uploads'];
  }

  async scanAndSync() {
    try {
      console.log('🔍 Escaneando storage local...');
      
      const results = {
        scanned: 0,
        added: 0,
        updated: 0,
        errors: 0,
        files: []
      };

      // Asegurar que las carpetas existen
      for (const folder of this.folders) {
        await fs.ensureDir(path.join(this.baseStoragePath, folder));
      }

      for (const folder of this.folders) {
        const folderPath = path.join(this.baseStoragePath, folder);
        
        if (!await fs.pathExists(folderPath)) {
          console.log(`📁 Carpeta no encontrada: ${folder}`);
          continue;
        }

        const files = await fs.readdir(folderPath);
        console.log(`📁 Escaneando ${folder}: ${files.length} archivos`);
        
        for (const file of files) {
          try {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              results.scanned++;
              
              const fileInfo = await this.processFile(folder, file, filePath, stats);
              if (fileInfo) {
                results.files.push(fileInfo);
                
                if (fileInfo.status === 'added') results.added++;
                if (fileInfo.status === 'updated') results.updated++;
              }
            }
          } catch (error) {
            console.error(`❌ Error procesando archivo ${file}:`, error);
            results.errors++;
          }
        }
      }

      console.log(`✅ Escaneo completado: ${results.scanned} archivos escaneados, ${results.added} añadidos, ${results.updated} actualizados`);
      return results;

    } catch (error) {
      console.error('❌ Error en escaneo de storage:', error);
      throw error;
    }
  }

  async processFile(folder, filename, filePath, stats) {
    // Determinar tipo de archivo
    const fileType = this.getFileType(folder, filename);
    const mimeType = this.getMimeType(filename);
    
    // Buscar archivo en base de datos por ruta
    const existingFiles = await db.collection('mediaFiles')
      .where('storageInfo.path', '==', `${folder}/${filename}`)
      .get();

    const fileData = {
      originalName: filename,
      fileType: fileType,
      mimeType: mimeType,
      size: stats.size,
      storageInfo: {
        storageType: 'local',
        path: `${folder}/${filename}`
      },
      metadata: {
        uploadDate: stats.birthtime.toISOString(),
        lastModified: stats.mtime.toISOString(),
        scannedAt: new Date().toISOString()
      }
    };

    if (existingFiles.empty) {
      // Archivo nuevo - agregar a base de datos
      const docRef = await db.collection('mediaFiles').add({
        ...fileData,
        ownerId: 'system',
        ownerEmail: 'system@magisoperativos.com',
        permissions: [
          {
            userId: 'system',
            email: 'system@magisoperativos.com',
            role: 'owner',
            permissions: ['read', 'write', 'delete']
          }
        ]
      });
      
      console.log(`✅ Archivo añadido: ${filename}`);
      return {
        id: docRef.id,
        ...fileData,
        status: 'added'
      };
    } else {
      // Archivo existente - actualizar si es necesario
      const existingDoc = existingFiles.docs[0];
      const existingData = existingDoc.data();
      
      // Verificar si el archivo ha cambiado
      if (existingData.size !== stats.size || 
          existingData.metadata.lastModified !== stats.mtime.toISOString()) {
        
        await db.collection('mediaFiles').doc(existingDoc.id).update({
          size: stats.size,
          'metadata.lastModified': stats.mtime.toISOString(),
          'metadata.scannedAt': new Date().toISOString()
        });
        
        console.log(`🔄 Archivo actualizado: ${filename}`);
        return {
          id: existingDoc.id,
          ...fileData,
          status: 'updated'
        };
      }
      
      return {
        id: existingDoc.id,
        ...fileData,
        status: 'unchanged'
      };
    }
  }

  getFileType(folder, filename) {
    // Si está en una carpeta específica, usar ese tipo
    if (folder === 'audio') return 'audio';
    if (folder === 'video') return 'video';
    if (folder === 'images') return 'image';
    if (folder === 'converted') {
      // Para converted, determinar por extensión
      const ext = path.extname(filename).toLowerCase();
      if (['.mp3', '.wav', '.flac', '.aac'].includes(ext)) return 'audio';
      if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) return 'video';
      return 'other';
    }
    
    // Determinar por extensión para uploads
    const ext = path.extname(filename).toLowerCase();
    const audioExt = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
    const videoExt = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];
    const imageExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    
    if (audioExt.includes(ext)) return 'audio';
    if (videoExt.includes(ext)) return 'video';
    if (imageExt.includes(ext)) return 'image';
    
    return 'other';
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = new StorageScanner();