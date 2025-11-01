import React, { useState, useEffect } from 'react';
import { 
  File, 
  Download, 
  Upload, 
  Music, 
  Video, 
  Image, 
  Loader,
  Cloud,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { filesAPI } from '../../services/api';
import { Card, CardContent, CardHeader } from '../UI/Card';

const EnhancedFileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({
    storage: 'all', // all, local, cloud
    type: 'all'     // all, audio, video, image
  });
  const [stats, setStats] = useState({ total: 0, local: 0, cloud: 0 });

  useEffect(() => {
    loadFiles();
  }, [filters]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.getAllUserFiles({
        includeLocal: filters.storage !== 'cloud',
        includeCloud: filters.storage !== 'local'
      });
      setFiles(response.data.files || []);
      setStats(response.data.counts || { total: 0, local: 0, cloud: 0 });
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadToLocal = async (fileId) => {
    try {
      setActionLoading(prev => ({ ...prev, [fileId]: 'downloading' }));
      await filesAPI.downloadToLocal(fileId);
      await loadFiles(); // Recargar lista
    } catch (error) {
      console.error('Error downloading to local:', error);
      alert('Error descargando archivo a local');
    } finally {
      setActionLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const handleUploadToCloud = async (fileId) => {
    try {
      setActionLoading(prev => ({ ...prev, [fileId]: 'uploading' }));
      await filesAPI.uploadToCloud(fileId);
      await loadFiles(); // Recargar lista
    } catch (error) {
      console.error('Error uploading to cloud:', error);
      alert('Error subiendo archivo a la nube');
    } finally {
      setActionLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const handleDirectDownload = async (fileId, fileName) => {
    try {
      setActionLoading(prev => ({ ...prev, [fileId]: 'direct' }));
      const response = await filesAPI.downloadFile(fileId);
      
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error descargando archivo');
    } finally {
      setActionLoading(prev => ({ ...prev, [fileId]: false }));
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
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    if (filters.type !== 'all' && file.fileType !== filters.type) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Archivos</h1>
        <p className="text-gray-600">Administra tus archivos locales y en la nube</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Archivos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <File className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En la Nube</p>
                <p className="text-2xl font-bold text-blue-600">{stats.cloud}</p>
              </div>
              <Cloud className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Locales</p>
                <p className="text-2xl font-bold text-green-600">{stats.local}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold">Todos los Archivos</h2>
            
            <div className="flex flex-wrap gap-2">
              {/* Filtro de almacenamiento */}
              <select
                value={filters.storage}
                onChange={(e) => setFilters(prev => ({ ...prev, storage: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los almacenamientos</option>
                <option value="cloud">Solo nube</option>
                <option value="local">Solo local</option>
              </select>

              {/* Filtro de tipo */}
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos los tipos</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="image">Imágenes</option>
              </select>

              <button
                onClick={loadFiles}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
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
                {filters.storage === 'all' && filters.type === 'all' 
                  ? 'Comienza subiendo algunos archivos.' 
                  : 'No hay archivos que coincidan con los filtros.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{file.originalName}</h3>
                        {getStorageIcon(file.storageInfo?.storageType)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="capitalize">{file.fileType}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          file.storageInfo?.storageType === 's3' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {file.storageInfo?.storageType === 's3' ? 'Nube' : 'Local'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Descargar directamente */}
                    <button 
                      onClick={() => handleDirectDownload(file.id, file.originalName)}
                      disabled={actionLoading[file.id]}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50"
                      title="Descargar archivo"
                    >
                      {actionLoading[file.id] === 'direct' ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </button>

                    {/* Subir a la nube (solo para archivos locales) */}
                    {file.storageInfo?.storageType === 'local' && (
                      <button 
                        onClick={() => handleUploadToCloud(file.id)}
                        disabled={actionLoading[file.id]}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Subir a la nube"
                      >
                        {actionLoading[file.id] === 'uploading' ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </button>
                    )}

                    {/* Descargar a local (solo para archivos en la nube) */}
                    {file.storageInfo?.storageType === 's3' && (
                      <button 
                        onClick={() => handleDownloadToLocal(file.id)}
                        disabled={actionLoading[file.id]}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
                        title="Descargar a almacenamiento local"
                      >
                        {actionLoading[file.id] === 'downloading' ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                      </button>
                    )}
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

export default EnhancedFileList;