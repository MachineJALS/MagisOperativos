// client/src/components/Media/AudioPlayer.js - VERSIÓN DEFINITIVA CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download } from 'lucide-react';
import { filesAPI } from '../../services/api';
import './AudioPlayer.css';

const AudioPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const loadAudioUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🎵 Cargando audio:', {
          id: file.id,
          name: file.originalName,
          storage: file.storageInfo?.storageType,
          isConverted: file.isConvertedFile
        });

        let url;
        
        // ✅ DETERMINAR TIPO DE ARCHIVO Y OBTENER URL CORRECTA
        if (file.storageInfo?.storageType === 'local') {
          // Para archivos locales, usar URL directa
          url = filesAPI.getLocalFileUrl(file);
          console.log('📁 Usando archivo local:', url);
        } else if (file.storageInfo?.storageType === 's3') {
          // Para archivos en S3, obtener URL firmada
          console.log('🔐 Obteniendo URL firmada para S3');
          const response = await filesAPI.getSignedUrl(file.id);
          if (response.data.success) {
            url = response.data.signedUrl;
            console.log('✅ URL firmada obtenida');
          } else {
            throw new Error('No se pudo obtener URL firmada para S3');
          }
        } else {
          // Fallback: intentar usar URL directa
          url = file.downloadUrl || file.storageInfo?.url;
          console.log('🔄 Usando URL directa:', url);
        }

        // ✅ VERIFICAR QUE LA URL NO SEA UNDEFINED
        if (!url) {
          throw new Error('No se pudo generar URL para el archivo');
        }

        setAudioUrl(url);
        
      } catch (err) {
        console.error('❌ Error cargando audio:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
        setError(`No se pudo cargar el audio: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      loadAudioUrl();
    }

    // Cleanup al desmontar
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [file]);

  // Controladores del audio nativo
  const togglePlay = async () => {
    if (!audioRef.current || !isReady) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Prevenir el error de interrupción
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('Error al reproducir:', err);
      setError('Error al reproducir: ' + err.message);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      let downloadUrl;
      
      if (file.storageInfo?.storageType === 'local') {
        // Para archivos locales, descarga directa
        downloadUrl = filesAPI.getLocalFileUrl(file);
      } else {
        // Para S3, obtener URL de descarga firmada
        const response = await filesAPI.getDownloadUrl(file.id);
        if (response.data.success) {
          downloadUrl = response.data.downloadUrl;
        } else {
          throw new Error('No se pudo obtener URL de descarga');
        }
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error descargando:', error);
      setError('Error al descargar el archivo');
    }
  };

  const handleCanPlay = () => {
    console.log('✅ Audio listo para reproducir');
    setIsReady(true);
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    console.log('📊 Metadatos del audio cargados');
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleError = (e) => {
    console.error('❌ Error de audio:', e);
    const audioElement = e.target;
    console.log('Audio error details:', {
      error: audioElement.error,
      networkState: audioElement.networkState,
      readyState: audioElement.readyState,
      src: audioElement.src
    });
    
    let errorMsg = 'Error al cargar el archivo de audio. ';
    
    if (!audioUrl) {
      errorMsg += 'No se pudo generar la URL del archivo.';
    } else if (audioElement.error) {
      switch (audioElement.error.code) {
        case audioElement.error.MEDIA_ERR_ABORTED:
          errorMsg += 'La reproducción fue abortada.';
          break;
        case audioElement.error.MEDIA_ERR_NETWORK:
          errorMsg += 'Error de red. Verifica tu conexión.';
          break;
        case audioElement.error.MEDIA_ERR_DECODE:
          errorMsg += 'Error al decodificar el archivo. Formato no soportado.';
          break;
        case audioElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMsg += 'Formato de archivo no soportado.';
          break;
        default:
          errorMsg += 'Error desconocido.';
      }
    } else {
      errorMsg += 'Verifica que el archivo exista en el servidor.';
    }
    
    setError(errorMsg);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStorageInfo = () => {
    if (file.storageInfo?.storageType === 'local') {
      return '📁 Archivo local';
    } else if (file.storageInfo?.storageType === 's3') {
      return '☁️ Archivo en la nube';
    }
    return '📄 Archivo';
  };

  if (loading) {
    return (
      <div className="audio-player-overlay">
        <div className="audio-player-container">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-gray-600 mt-4">Cargando audio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player-overlay">
        <div className="audio-player-container">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4 whitespace-pre-wrap">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-player-overlay">
      <div className="audio-player-container">
        {/* Header */}
        <div className="audio-player-header">
          <div className="audio-player-info">
            <h2 className="audio-title">{file.originalName}</h2>
            <p className="audio-subtitle">
              🎵 {file.fileType?.toUpperCase()} • {Math.round(file.size / 1024 / 1024)}MB
              {file.isConvertedFile && ' • 🎯 Convertido'}
            </p>
          </div>
          <div className="audio-player-actions">
            <button 
              onClick={handleDownload}
              className="audio-action-btn"
              title="Descargar"
            >
              <Download className="audio-icon" />
            </button>
            <button 
              onClick={onClose}
              className="audio-action-btn close-btn"
            >
              <X className="audio-icon" />
            </button>
          </div>
        </div>

        {/* Audio Visualization */}
        <div className="audio-player-content">
          <div className="audio-visualization">
            <div className="sound-waves">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="sound-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: isPlaying ? `${Math.random() * 50 + 10}px` : '10px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Audio Element (hidden) */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={handleError}
            preload="metadata"
            className="audio-element"
          />
        </div>

        {/* Controls */}
        <div className="audio-player-controls">
          {/* Progress Bar */}
          <div className="progress-container">
            <span className="time-display current-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
              disabled={!isReady}
            />
            <span className="time-display total-time">{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="control-buttons">
            <div className="playback-controls">
              <button 
                onClick={togglePlay}
                disabled={!isReady}
                className="play-pause-btn"
              >
                {isPlaying ? (
                  <Pause className="play-icon" />
                ) : (
                  <Play className="play-icon" />
                )}
              </button>
            </div>

            <div className="volume-controls">
              <button 
                onClick={toggleMute}
                className="volume-btn"
              >
                {isMuted ? (
                  <VolumeX className="control-icon" />
                ) : (
                  <Volume2 className="control-icon" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="audio-player-footer">
          <div className="storage-info">
            {getStorageInfo()} • {formatTime(duration)} • {Math.round(file.size / 1024 / 1024)}MB
            {file.isConvertedFile && ' • 🎯 Conversión ' + (file.metadata?.conversionType || 'simulada')}
          </div>
          {file.storageInfo?.storageType === 'local' && (
            <div className="text-xs text-blue-600 mt-1">
              📍 Ruta: {file.storageInfo?.actualPath || file.storageInfo?.path}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;