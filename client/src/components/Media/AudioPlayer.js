// client/src/components/Media/AudioPlayer.js - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download } from 'lucide-react';
import { filesAPI } from '../../services/api';

const AudioPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const loadSignedUrl = async () => {
      try {
        setLoading(true);
        console.log('🎵 Cargando audio:', file.id);
        
        const response = await filesAPI.getSignedUrl(file.id);
        const url = response.data.signedUrl;
        console.log('✅ URL obtenida:', url);
        
        setSignedUrl(url);
      } catch (err) {
        console.error('❌ Error:', err);
        setError('No se pudo cargar el audio: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (file) {
      loadSignedUrl();
    }
  }, [file]);

  // Controladores del audio nativo
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error('Error al reproducir:', e);
          setError('Error al reproducir: ' + e.message);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
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
    }
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
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando audio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-600">🎵 Audio • {file.fileType}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleDownload}
              className="text-gray-500 hover:text-blue-600 transition-colors p-1"
              title="Descargar"
            >
              <Download className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Audio Element (hidden) */}
        <audio
          ref={audioRef}
          src={signedUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Error de audio:', e);
            setError('Error al cargar el archivo de audio');
          }}
          preload="metadata"
        />

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="h-6 w-6" />
                <span className="font-medium">Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-6 w-6" />
                <span className="font-medium">Reproducir</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
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
              className="w-20 accent-blue-600"
            />
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-500">
            🔐 URL segura • {formatTime(duration)} • {Math.round(file.size / 1024 / 1024)}MB
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;