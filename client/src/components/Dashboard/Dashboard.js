// client/src/components/Dashboard/Dashboard.js - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import Sidebar from '../Layout/Sidebar';
import FileUpload from './FileUpload';
import SystemMonitor from './SystemMonitor';
import FileList from './FileList';
import { filesAPI } from '../../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('files');
  const [scanning, setScanning] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar archivos al montar el componente
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await filesAPI.getAllUserFiles();
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error cargando archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanLocalFiles = async () => {
    setScanning(true);
    try {
      const response = await filesAPI.scanLocalFiles();
      if (response.data.success) {
        alert(`✅ ${response.data.message}\n\nEncontrados:\n• ${response.data.audio.length} archivos de audio\n• ${response.data.video.length} archivos de video`);
        // Recargar la lista de archivos
        await loadFiles();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error escaneando archivos locales:', error);
      alert(`❌ Error escaneando archivos locales: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUploaded = () => {
    // Recargar archivos después de una subida exitosa
    loadFiles();
  };

  const handleConversionComplete = () => {
    // Recargar archivos después de una conversión
    loadFiles();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'upload':
        return <FileUpload onUploadSuccess={handleFileUploaded} />;
      case 'monitor':
        return <SystemMonitor />;
      case 'files':
      default:
        return (
          <div className="space-y-6">
            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white rounded-lg shadow-sm border">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Mis Archivos</h2>
                <p className="text-sm text-gray-600">
                  {loading ? 'Cargando...' : `${files.length} archivos encontrados`}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Botón Escanear Archivos Locales */}
                <button 
                  onClick={handleScanLocalFiles}
                  disabled={scanning}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {scanning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Escaneando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      📁 Escanear Locales
                    </>
                  )}
                </button>

                {/* Botón Recargar */}
                <button 
                  onClick={loadFiles}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </button>
              </div>
            </div>

            {/* Lista de archivos */}
            <FileList 
              files={files} 
              loading={loading}
              onFileUpdate={loadFiles}
              onConversionComplete={handleConversionComplete}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;