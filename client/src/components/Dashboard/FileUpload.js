// client/src/components/Dashboard/FileUpload.js - VERSIÓN CORREGIDA
import React, { useState, useCallback } from 'react';
import { Upload, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { filesAPI } from '../../services/api';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await filesAPI.upload(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `✅ Archivo "${file.name}" subido correctamente`
        });
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          setProgress(0);
        }, 5000);
      } else {
        throw new Error(response.data.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setMessage({
        type: 'error',
        text: `❌ Error subiendo archivo: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]; // ✅ CORREGIDO: definir la variable
      
      // Validar tipo de archivo
      const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac',
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'image/jpeg', 'image/png', 'image/gif'
      ];

      if (!allowedTypes.includes(droppedFile.type)) {
        setMessage({
          type: 'error',
          text: 'Tipo de archivo no permitido. Solo audio, video e imágenes.'
        });
        return;
      }

      // Validar tamaño (500MB máximo)
      if (droppedFile.size > 500 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Archivo demasiado grande. Límite: 500MB'
        });
        return;
      }

      uploadFile(droppedFile);
    }
  }, []); // ✅ CORREGIDO: sin dependencias problemáticas

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]; // ✅ CORREGIDO: definir la variable

      // Validar tipo de archivo
      const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac',
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'image/jpeg', 'image/png', 'image/gif'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage({
          type: 'error',
          text: 'Tipo de archivo no permitido. Solo audio, video e imágenes.'
        });
        return;
      }

      // Validar tamaño (500MB máximo)
      if (selectedFile.size > 500 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Archivo demasiado grande. Límite: 500MB'
        });
        return;
      }

      uploadFile(selectedFile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subir Archivo Multimedia</h2>
        <p className="text-gray-600">Sube archivos de audio, video o imágenes hasta 500MB</p>
      </div>

      {/* Área de Subida */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploading 
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          onChange={handleFileSelect}
          accept="audio/*,video/*,image/*"
          disabled={uploading}
          className="hidden"
        />
        
        <label htmlFor="file-input" className="cursor-pointer">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí o'}
            </p>
            <p className="text-blue-600 font-medium underline">haz clic para buscar</p>
            <p className="text-sm text-gray-500">
              Soporta: MP3, WAV, FLAC, MP4, AVI, MOV, JPEG, PNG, GIF
            </p>
          </div>
        </label>

        {/* Barra de Progreso */}
        {uploading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{progress}% completado</p>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {message.text && (
        <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Consejos */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">💡 Consejos para la subida:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Archivos de audio: MP3, WAV, FLAC (hasta 500MB)</li>
          <li>• Archivos de video: MP4, AVI, MOV (hasta 500MB)</li>
          <li>• Imágenes: JPEG, PNG, GIF (hasta 50MB)</li>
          <li>• Los archivos se almacenan en la nube automáticamente</li>
          <li>• Puedes convertir formatos después de subir</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;