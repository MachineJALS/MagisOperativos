// client/src/components/Dashboard/FileList.js - VERSIÓN MEJORADA CON SCROLL
import React, { useState, useEffect, useCallback } from 'react';
import { 
  File, 
  Play, 
  Download, 
  Music, 
  Video, 
  Image, 
  RefreshCw, 
  Cloud, 
  HardDrive,
  Search,
  Filter
} from 'lucide-react';
import { filesAPI } from '../../services/api';
import AudioPlayer from '../Media/AudioPlayer';
import VideoPlayer from '../Media/VideoPlayer';
import ConversionPanel from '../Media/ConversionPanel';
import './FileList.css'; // ✅ CSS para scroll y responsive

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentConversion, setCurrentConversion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadFiles = useCallback(async () => {
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
  }, [filter]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
      
      const response = await filesAPI.getDownloadUrl(file.id);
      const downloadUrl = response.data.downloadUrl;
      
      console.log('✅ URL de descarga obtenida');

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Descarga iniciada');
      
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      alert('❌ Error al descargar el archivo. Verifica la consola para más detalles.');
    }
  };

  const handleConvertFile = (file) => {
    setCurrentConversion(file);
  };

  const handleConversionComplete = (convertedFile) => {
    console.log('✅ Conversión completada:', convertedFile);
    loadFiles();
  };

  // ✅ Filtrar archivos por búsqueda y tipo
  const filteredFiles = files.filter(file => {
    const matchesFilter = filter === 'all' || file.fileType === filter;
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="file-list-container">
      {/* Header Compacto */}
      <div className="file-list-header">
        <div className="header-content">
          <div className="header-title">
            <h1 className="text-xl font-bold text-gray-900">Mis Archivos</h1>
            <p className="text-sm text-gray-600">Gestiona tus archivos multimedia</p>
          </div>
          <button
            onClick={syncS3Files}
            disabled={syncing}
            className="sync-button"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar S3'}</span>
          </button>
        </div>

        {/* Búsqueda */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Filtros Compactos */}
        <div className="filters-container">
          {['all', 'audio', 'video', 'image'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`filter-button ${filter === type ? 'filter-button-active' : ''}`}
            >
              {type === 'all' && '📁 Todos'}
              {type === 'audio' && '🎵 Audio'}
              {type === 'video' && '🎬 Video'}
              {type === 'image' && '🖼️ Imágenes'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Archivos - Scrollable */}
      <div className="files-content">
        {loading ? (
          <div className="loading-state">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando archivos...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            <File className="h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 text-center">No hay archivos</h3>
            <p className="text-xs text-gray-500 text-center mt-1">
              {filter === 'all' 
                ? 'Comienza sincronizando con S3.' 
                : `No hay archivos de tipo ${filter}.`}
            </p>
          </div>
        ) : (
          <div className="files-list">
            {filteredFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  {getFileIcon(file.fileType)}
                  <div className="file-details">
                    <h3 className="file-name">{file.originalName}</h3>
                    <div className="file-meta">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.metadata.uploadDate)}</span>
                      <span>•</span>
                      {getStorageIcon(file.storageInfo?.storageType)}
                      <span>{file.storageInfo?.storageType === 's3' ? 'S3' : 'Local'}</span>
                      
                      {file.metadata?.conversion && (
                        <>
                          <span>•</span>
                          <span className="conversion-badge">Convertido</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Botones de Acción Compactos */}
                <div className="file-actions">
                  {(file.fileType === 'audio' || file.fileType === 'video') && (
                    <button 
                      onClick={() => handlePlayFile(file)}
                      className="action-button play-button"
                      title="Reproducir"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  {(file.fileType === 'audio' || file.fileType === 'video') && (
                    <button 
                      onClick={() => handleConvertFile(file)}
                      className="action-button convert-button"
                      title="Convertir archivo"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDownloadFile(file)}
                    className="action-button download-button"
                    title="Descargar"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
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
      
      {currentConversion && (
        <ConversionPanel 
          file={currentConversion} 
          onClose={() => setCurrentConversion(null)}
          onConversionComplete={handleConversionComplete}
        />
      )}
    </div>
  );
};

export default FileList;