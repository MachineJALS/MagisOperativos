import React, { useState } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';
import { filesAPI } from '../../services/api';
import Button from '../UI/Button';
import { Card, CardContent, CardHeader } from '../UI/Card';

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setMessage({ type: '', text: '' });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un archivo' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        // Simular progreso
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        const response = await filesAPI.upload(formData);
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        console.log('Archivo subido:', response.data);
      }

      setMessage({ type: 'success', text: 'Todos los archivos se subieron correctamente' });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error subiendo archivos:', error);
      setMessage({ type: 'error', text: 'Error al subir archivos: ' + error.message });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const removeFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subir Archivos</h1>
        <p className="text-gray-600">Sube tus archivos multimedia al sistema distribuido</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Seleccionar Archivos</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="primary">
                    Seleccionar Archivos
                  </Button>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="audio/*,video/*,image/*"
                  />
                </label>
                <p className="mt-2 text-sm text-gray-600">
                  Formatos soportados: MP3, WAV, FLAC, MP4, AVI, MOV, JPG, PNG
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Archivos seleccionados:</h3>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {uploadProgress[file.name] !== undefined && (
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          ></div>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {message.text && (
              <div className={`p-4 rounded-lg ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {message.text}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                variant="primary"
                size="large"
              >
                {uploading ? 'Subiendo...' : 'Subir Archivos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUpload;