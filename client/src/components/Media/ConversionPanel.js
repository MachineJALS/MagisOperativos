// client/src/components/Media/ConversionPanel.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Settings, Info } from 'lucide-react';
import { filesAPI } from '../../services/api';

const ConversionPanel = ({ file, onClose, onConversionComplete }) => {
  const [targetFormat, setTargetFormat] = useState('');
  const [quality, setQuality] = useState('medium');
  const [converting, setConverting] = useState(false);
  const [formats, setFormats] = useState([]);

  useEffect(() => {
    const loadFormats = () => {
      const defaultFormats = file.fileType === 'audio' ? [
        { value: 'mp3', label: 'MP3', description: 'Compatible universal', recommended: true },
        { value: 'wav', label: 'WAV', description: 'Calidad sin pérdida', recommended: false },
        { value: 'flac', label: 'FLAC', description: 'Comprimido sin pérdida', recommended: false }
      ] : [
        { value: 'mp4', label: 'MP4', description: 'Compatible universal', recommended: true },
        { value: 'webm', label: 'WebM', description: 'Optimizado para web', recommended: false },
        { value: 'avi', label: 'AVI', description: 'Formato antiguo', recommended: false }
      ];
      
      setFormats(defaultFormats);
      
      const recommended = defaultFormats.find(f => f.recommended);
      setTargetFormat(recommended ? recommended.value : (defaultFormats[0]?.value || ''));
    };

    loadFormats();
  }, [file.fileType]);

  const handleConvert = async () => {
    if (!targetFormat) {
      alert('Por favor selecciona un formato de destino');
      return;
    }

    setConverting(true);
    try {
      console.log('🔄 Iniciando conversión real...', {
        fileId: file.id,
        targetFormat: targetFormat,
        fileType: file.fileType
      });

      const response = await filesAPI.convertReal(file.id, targetFormat);

      if (response.data.success) {
        console.log('✅ Conversión exitosa:', response.data.convertedFile);
        
        if (onConversionComplete) {
          onConversionComplete(response.data.convertedFile);
        }

        const conversionInfo = response.data.conversionInfo;
        const message = conversionInfo.type === 'simulated' 
          ? `✅ Conversión SIMULADA completada!\n\n` +
            `Archivo convertido: ${response.data.convertedFile.name}\n` +
            `Formato: ${response.data.convertedFile.format}\n` +
            `Reducción de tamaño: ${response.data.convertedFile.sizeReduction}%\n` +
            `Nota: Conversión real requiere procesamiento local`
          : `✅ Conversión REAL completada!\n\n` +
            `Archivo convertido: ${response.data.convertedFile.name}\n` +
            `Formato: ${response.data.convertedFile.format}\n` +
            `Tamaño: ${Math.round(response.data.convertedFile.size / 1024 / 1024)}MB\n` +
            `Reducción: ${response.data.convertedFile.sizeReduction}%`;

        alert(message);
        
        onClose();
      } else {
        throw new Error(response.data.error || 'Error desconocido en la conversión');
      }
    } catch (error) {
      console.error('❌ Error en conversión:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error de conexión';
      alert(`❌ Error en conversión: ${errorMessage}\n\nNota: Los archivos en AWS S3 requieren conversión simulada por ahora.`);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Convertir Archivo</h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{file.originalName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Información del archivo original */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Archivo original</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {file.fileType === 'audio' ? '🎵' : file.fileType === 'video' ? '🎬' : '🖼️'} 
                  {file.fileType?.toUpperCase()} • {Math.round(file.size / 1024 / 1024)}MB
                </p>
              </div>
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          {/* Selector de formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Formato de destino
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {formats.map(format => (
                <label 
                  key={format.value}
                  className={`flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all min-w-0 ${
                    targetFormat === format.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetFormat"
                    value={format.value}
                    checked={targetFormat === format.value}
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">{format.label}</span>
                        {format.recommended && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">.{format.value}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Selector de calidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Calidad de conversión
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {['low', 'medium', 'high'].map(level => (
                <label 
                  key={level}
                  className={`flex flex-col items-center p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                    quality === level 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={level}
                    checked={quality === level}
                    onChange={(e) => setQuality(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900 text-xs sm:text-sm capitalize mt-1 sm:mt-2 text-center">
                    {level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Información de conversión */}
          {targetFormat && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-800">Resumen de Conversión</span>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-blue-700 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                <div className="truncate">
                  <strong>Original:</strong> {file.originalName}
                </div>
                <div className="truncate">
                  <strong>Destino:</strong> {file.originalName.replace(/\.[^/.]+$/, '')}.{targetFormat}
                </div>
                <div>
                  <strong>Calidad:</strong> {quality === 'low' ? 'Baja' : quality === 'medium' ? 'Media' : 'Alta'}
                </div>
                <div>
                  <strong>Almacenamiento:</strong> Nube ☁️ (AWS S3)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 md:p-6 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
          <button
            onClick={handleConvert}
            disabled={converting || !targetFormat}
            className="flex-1 bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${converting ? 'animate-spin' : ''}`} />
            <span>{converting ? 'Convirtiendo...' : 'Iniciar Conversión'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversionPanel;