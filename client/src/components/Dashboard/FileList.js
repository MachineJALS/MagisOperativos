// client/src/components/Dashboard/FileList.js - VERSIÓN ACTUALIZADA
import React, { useState, useEffect } from 'react';
import { File, Play, Download, Music, Video, Image, RefreshCw, CloudUpload, Cloud, HardDrive } from 'lucide-react';
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
      
      // ✅ ACTUALIZACIÓN AUTOMÁTICA SIN RECARGAR
      await loadFiles();
      
      // Mostrar resultado
      const totalSynced = response.data.results.movies.synced + response.data.results.music.synced;
      if (totalSynced > 0) {
        alert(`✅ Sincronizados ${totalSynced} archivos\n• Películas: ${response.data.results.movies.synced}\n• Música: ${response.data.results.music.synced}`);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePlayFile = (file) => {
    if (file.fileType === 'audio') {
      setCurrentAudio(file);
    } else if (file.fileType === 'video') {
      setCurrentVideo(file);
    } else {
      alert(`📁 Archivo: ${file.originalName}\nEste tipo de archivo no se puede reproducir.`);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      // Crear enlace de descarga temporal
      const link = document.createElement('a');
      link.href = file.storageInfo?.url;
      link.download = file.originalName;
      link.target = '_blank';
      link.click();
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('❌ Error al descargar el archivo');
    }
  };

  const handleDownloadToLocal = async (file) => {
    try {
      alert('🔄 Funcionalidad "Descargar a Local" en desarrollo');
      // await filesAPI.downloadToLocal(file.id);
    } catch (error) {
      console.error('Error descargando a local:', error);
      alert('❌ Error descargando a almacenamiento local');
    }
  };

  const handleUploadToCloud = async (file) => {
    try {
      alert('☁️ Funcionalidad "Subir a la Nube" en desarrollo');
      // await filesAPI.uploadToCloud(file.id);
    } catch (error) {
      console.error('Error subiendo a la nube:', error);
      alert('❌ Error subiendo a la nube');
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.fileType === filter;
  });

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Archivos Multimedia {files.length > 0 && `(${files.length})`}
            </h2>
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
                  ? 'Comienza subiendo algunos archivos o sincronizando con S3.' 
                  : `No hay archivos de tipo ${filter}.`}
              </p>
              <button
                onClick={syncS3Files}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                🔄 Sincronizar con S3
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.fileType)}
                    <div>
                      <h3 className="font-medium text-gray-900">{file.originalName}</h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {formatDate(file.metadata.uploadDate)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStorageIcon(file.storageInfo?.storageType)}
                        <span className="text-xs text-gray-400">
                          {file.storageInfo?.storageType === 's3' ? 'AWS S3' : 'Almacenamiento Local'}
                          {file.metadata?.syncedFromS3 && ' • Sincronizado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(file.fileType === 'audio' || file.fileType === 'video') && (
                      <button 
                        onClick={() => handlePlayFile(file)}
                        className="flex items-center space-x-1 p-2 text-gray-600 hover:text-green-600 transition-colors"
                        title={`Reproducir ${file.fileType}`}
                      >
                        <Play className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Reproducir</span>
                      </button>
                    )}
                    
                    {/* Botón para archivos en S3 */}
                    {file.storageInfo?.storageType === 's3' && (
                      <button 
                        onClick={() => handleDownloadToLocal(file)}
                        className="flex items-center space-x-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Descargar a almacenamiento local"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Descargar</span>
                      </button>
                    )}
                    
                    {/* Botón para archivos locales */}
                    {file.storageInfo?.storageType === 'local' && (
                      <button 
                        onClick={() => handleUploadToCloud(file)}
                        className="flex items-center space-x-1 p-2 text-gray-600 hover:text-orange-600 transition-colors"
                        title="Subir a la nube"
                      >
                        <CloudUpload className="h-4 w-4" />
                        <span className="text-xs hidden sm:inline">Subir</span>
                      </button>
                    )}
                    
                    {/* Botón de descarga directa */}
                    <button 
                      onClick={() => handleDownloadFile(file)}
                      className="flex items-center space-x-1 p-2 text-gray-600 hover:text-purple-600 transition-colors"
                      title="Descargar archivo"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-xs hidden sm:inline">Descargar</span>
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