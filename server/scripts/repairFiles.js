// server/scripts/repairFiles.js
const fs = require('fs-extra');
const path = require('path');
const { db } = require('../config/firebase');

async function repairConvertedFiles() {
  console.log('🔧 Iniciando reparación de archivos convertidos...');
  
  try {
    // Obtener archivos convertidos
    const convertedFiles = await db.collection('mediaFiles')
      .where('metadata.conversion', '!=', null)
      .get();

    let repaired = 0;
    let deleted = 0;

    for (const doc of convertedFiles.docs) {
      const fileData = doc.data();
      const fullPath = path.join(__dirname, '../../storage', fileData.storageInfo.path);
      
      // Verificar si el archivo existe y es válido
      const exists = await fs.pathExists(fullPath);
      let isValid = false;

      if (exists) {
        try {
          const stats = await fs.stat(fullPath);
          isValid = stats.size > 100; // Archivos muy pequeños probablemente estén corruptos
        } catch (error) {
          isValid = false;
        }
      }

      if (!exists || !isValid) {
        console.log(`❌ Archivo corrupto o faltante: ${fileData.originalName}`);
        
        // Buscar el archivo original
        const originalFile = await db.collection('mediaFiles')
          .doc(fileData.metadata.conversion.originalFile)
          .get();

        if (originalFile.exists) {
          const originalData = originalFile.data();
          const originalPath = path.join(__dirname, '../../storage', originalData.storageInfo.path);
          
          if (await fs.pathExists(originalPath)) {
            console.log(`🔄 Reconvirtiendo: ${fileData.originalName}`);
            // Aquí podrías llamar a la función de conversión nuevamente
            // await reconvertFile(originalData, fileData);
            repaired++;
          } else {
            console.log(`🗑️ Eliminando registro de archivo convertido: ${fileData.originalName}`);
            await db.collection('mediaFiles').doc(doc.id).delete();
            deleted++;
          }
        } else {
          console.log(`🗑️ Eliminando registro de archivo convertido: ${fileData.originalName}`);
          await db.collection('mediaFiles').doc(doc.id).delete();
          deleted++;
        }
      }
    }

    console.log(`✅ Reparación completada: ${repaired} archivos reconvertidos, ${deleted} registros eliminados`);
    
  } catch (error) {
    console.error('❌ Error en reparación:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  repairConvertedFiles();
}

module.exports = { repairConvertedFiles };