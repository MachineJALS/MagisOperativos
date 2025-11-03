// client/src/components/Media/VideoPlayer.js - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download, Maximize2, Minimize2 } from 'lucide-react';
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
  
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const loadSignedUrl = async () => {
      try {
        setLoading(true);
        console.log('🎬 Cargando video:', file.id);
        
        const response = await filesAPI.getSignedUrl(file.id);
        const url = response.data.signedUrl;
        console.log('✅ URL obtenida:', url);
        
        setSignedUrl(url);
      } catch (err) {
        console.error('❌ Error:', err);
        setError('No se pudo cargar el video: ' + err.message);
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
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => {
          console.error('Error al reproducir:', e);
          setError('Error al reproducir: ' + e.message);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error('Error al entrar en pantalla completa:', err);
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
      const response = await filesAPI.getDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando:', error);
      alert('❌ Error al descargar');
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando video...</p>
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
            <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
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
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Error de video:', e);
            setError('Error al cargar el archivo de video');
          }}
          preload="metadata"
        />

        {/* Header Controls */}
        {showControls && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 z-10">
            <div className="flex justify-between items-center">
              <div className="text-white flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{file.originalName}</h3>
                <p className="text-sm text-gray-300">🎬 Video • {file.fileType}</p>
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
              <button
                onClick={togglePlay}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>

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
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black bg-opacity-50 rounded-full p-6 hover:bg-opacity-70 transition-all"
            >
              <Play className="h-16 w-16 text-white" />
            </button>
          </div>
        )}

        {/* Security Info */}
        {showControls && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
            🔐 URL segura • {formatTime(duration)} • {Math.round(file.size / 1024 / 1024)}MB
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;