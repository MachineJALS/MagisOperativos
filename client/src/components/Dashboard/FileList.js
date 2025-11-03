// client/src/components/Dashboard/FileList.js
import React, { useState, useEffect } from 'react';
import { File, Play, Download, Music, Video, Image, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import { filesAPI } from '../../services/api';
import { Card, CardContent, CardHeader } from '../UI/Card';
import AudioPlayer from '../Media/AudioPlayer';
import VideoPlayer from '../Media/VideoPlayer';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);

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

  const syncS3Files = async () => {
    try {
      setSyncing(true);
      const response = await filesAPI.syncS3();
      await loadFiles();
      
      const totalSynced = response.data.results.movies.synced + response.data.results.music.synced;
      if (totalSynced > 0) {
        alert(`✅ Sincronizados ${totalSynced} archivos`);
      } else {
        alert('📁 Todos los archivos ya estaban sincronizados');
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert('❌ Error sincronizando archivos');
    } finally {
      setSyncing(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'audio': return <Music className="h-5 w-5 text-blue-500" />;
      case 'video': return <Video className="h-5 w-5 text-purple-500" />;
      case 'image': return <Image className="h-5 w-5 text-green-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStorageIcon = (storageType) => {
    return storageType === 's3' 
      ? <Cloud className="h-4 w-4 text-blue-500" />
      : <HardDrive className="h-4 w-4 text-green-500" />;
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
      day: 'numeric'
    });
  };

  const handlePlayFile = (file) => {
    if (file.fileType === 'audio') {
      setCurrentAudio(file);
    } else if (file.fileType === 'video') {
      setCurrentVideo(file);
    } else {
      alert(`📁 ${file.originalName}\nEste tipo de archivo no se puede reproducir.`);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      console.log('📥 Iniciando descarga de:', file.originalName);
      
      // Obtener URL firmada para descarga
      const response = await filesAPI.getDownloadUrl(file.id);
      const downloadUrl = response.data.downloadUrl;
      
      console.log('✅ URL de descarga obtenida');

      // Crear enlace de descarga temporal
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      link.target = '_blank';
      
      // Agregar al DOM y hacer clic
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Descarga iniciada');
      
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      alert('❌ Error al descargar el archivo. Verifica la consola para más detalles.');
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.fileType === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Archivos</h1>
          <p className="text-gray-600">Gestiona tus archivos multimedia</p>
        </div>
        <button
          onClick={syncS3Files}
          disabled={syncing}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizando...' : '🔄 Sincronizar S3'}</span>
        </button>
      </div>

      {/* File List */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando archivos...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay archivos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'Comienza sincronizando con S3.' 
                  : `No hay archivos de tipo ${filter}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.fileType)}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {file.originalName}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.metadata.uploadDate)}</span>
                        <span>•</span>
                        {getStorageIcon(file.storageInfo?.storageType)}
                        <span>{file.storageInfo?.storageType === 's3' ? 'S3' : 'Local'}</span>
                        {file.storageInfo?.storageType === 's3' && (
                          <span className="text-blue-500">🔐</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(file.fileType === 'audio' || file.fileType === 'video') && (
                      <button 
                        onClick={() => handlePlayFile(file)}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                        title="Reproducir"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadFile(file)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reproductores */}
      {currentAudio && (
        <AudioPlayer 
          file={currentAudio} 
          onClose={() => setCurrentAudio(null)} 
        />
      )}
      {currentVideo && (
        <VideoPlayer 
          file={currentVideo} 
          onClose={() => setCurrentVideo(null)} 
        />
      )}
    </div>
  );
};

export default FileList;