// client/src/components/Media/VideoPlayer.js - VERSIÓN OPTIMIZADA
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download, Maximize2, Minimize2, Loader } from 'lucide-react';
import { filesAPI } from '../../services/api';

const VideoPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const loadSignedUrl = async () => {
      try {
        setLoading(true);
        setBuffering(true);
        console.log('🎬 Cargando video grande:', file.originalName, 'Tamaño:', Math.round(file.size / 1024 / 1024) + 'MB');
        
        // Añadir timeout para archivos grandes
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout cargando video')), 30000)
        );
        
        const urlPromise = filesAPI.getSignedUrl(file.id);
        
        const response = await Promise.race([urlPromise, timeoutPromise]);
        const url = response.data.signedUrl;
        console.log('✅ URL firmada obtenida para video grande');
        
        setSignedUrl(url);
      } catch (err) {
        console.error('❌ Error cargando video grande:', err);
        setError(`No se pudo cargar el video: ${err.message}. El archivo puede ser muy grande.`);
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      loadSignedUrl();
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [file]);

  // Controladores del video nativo
  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error al reproducir:', err);
        setError(`Error de reproducción: ${err.message}`);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const element = videoRef.current.parentElement;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error('Error fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleDownload = async () => {
    try {
      console.log('📥 Iniciando descarga de video grande...');
      const response = await filesAPI.getDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando:', error);
      alert('❌ Error al descargar el video');
    }
  };

  // Manejo de eventos del video
  const handleLoadStart = () => {
    console.log('🔄 Video empezando a cargar...');
    setBuffering(true);
  };

  const handleCanPlay = () => {
    console.log('✅ Video puede reproducirse');
    setBuffering(false);
  };

  const handleWaiting = () => {
    console.log('⏳ Video esperando datos...');
    setBuffering(true);
  };

  const handlePlaying = () => {
    console.log('▶️ Video reproduciéndose');
    setBuffering(false);
  };

  const handleError = (e) => {
    console.error('🚨 Error de video:', e);
    const video = e.target;
    let errorMsg = 'Error desconocido';
    
    if (video.error) {
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMsg = 'Reproducción cancelada';
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMsg = 'Error de red - el video es muy grande para streaming';
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMsg = 'Error de decodificación - formato no compatible';
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMsg = 'Formato de video no soportado';
          break;
      }
    }
    
    setError(`Error de video: ${errorMsg}`);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Efecto para manejar eventos de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Cargando video...</p>
          <p className="text-gray-400 text-sm mt-2">
            {file.originalName} ({Math.round(file.size / 1024 / 1024)}MB)
          </p>
          <p className="text-gray-500 text-xs mt-1">Los videos grandes pueden tardar más en cargar</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-white mb-2">Error con Video Grande</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="text-xs text-gray-400 mb-4 p-3 bg-gray-900 rounded">
              <p><strong>Archivo:</strong> {file.originalName}</p>
              <p><strong>Tamaño:</strong> {Math.round(file.size / 1024 / 1024)} MB</p>
              <p><strong>Tipo:</strong> {file.fileType}</p>
              <p><strong>Formato:</strong> {file.mimeType}</p>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
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
    <div 
      className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'p-4'}`}
      onMouseMove={handleMouseMove}
    >
      <div className={`relative bg-black ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl mx-auto rounded-lg overflow-hidden'}`}>
        
        {/* Video Element */}
        <video
          ref={videoRef}
          src={signedUrl}
          className="w-full h-full"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={() => setIsPlaying(false)}
          onError={handleError}
          preload="auto"
          playsInline
          webkit-playsinline="true"
        />

        {/* Buffering Indicator */}
        {buffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <Loader className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
              <p className="text-white">Cargando video...</p>
            </div>
          </div>
        )}

        {/* Header Controls */}
        {showControls && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10">
            <div className="flex justify-between items-center">
              <div className="text-white flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{file.originalName}</h3>
                <p className="text-sm text-gray-300">
                  🎬 Video • {Math.round(file.size / 1024 / 1024)}MB • {formatTime(duration)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDownload}
                  className="text-white hover:text-blue-300 transition-colors p-2"
                  title="Descargar"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button 
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-300 transition-colors p-2"
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
                <button 
                  onClick={onClose}
                  className="text-white hover:text-gray-300 transition-colors p-2"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                </button>

                {/* Playback Speed */}
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">Velocidad:</span>
                  <select 
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className="bg-gray-700 text-white text-sm rounded px-2 py-1"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1.0">Normal</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleMute}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Play Button (when paused) */}
        {!isPlaying && !buffering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black bg-opacity-50 rounded-full p-6 hover:bg-opacity-70 transition-all"
            >
              <Play className="h-16 w-16 text-white" />
            </button>
          </div>
        )}

        {/* Video Info */}
        {showControls && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
            🔐 URL segura • {Math.round(file.size / 1024 / 1024)}MB • {playbackRate}x
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;