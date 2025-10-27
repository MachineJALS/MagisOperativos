import React, { useState, useEffect } from 'react';
import { File, Play, Download, Music, Video, Image } from 'lucide-react';
import { filesAPI } from '../../services/api';
import { Card, CardContent, CardHeader } from '../UI/Card';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadFiles();
  }, [filter]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const type = filter === 'all' ? '' : filter;
      const response = await filesAPI.getMyFiles(type);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'audio':
        return <Music className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.fileType === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Archivos</h1>
        <p className="text-gray-600">Gestiona tus archivos multimedia</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Archivos Multimedia</h2>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los archivos</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="image">Imágenes</option>
              </select>
              <button
                onClick={loadFiles}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando archivos...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay archivos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'Comienza subiendo algunos archivos.' 
                  : `No hay archivos de tipo ${filter}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.fileType)}
                    <div>
                      <h3 className="font-medium text-gray-900">{file.originalName}</h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {formatDate(file.metadata.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(file.fileType === 'audio' || file.fileType === 'video') && (
                      <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                        <Play className="h-5 w-5" />
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileList;