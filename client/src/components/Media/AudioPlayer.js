// client/src/components/Media/AudioPlayer.js
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download } from 'lucide-react';
import './AudioPlayer.css';

const AudioPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => console.log('🎵 Cargando audio...');

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error reproduciendo audio:', error);
        alert('❌ Error al reproducir el audio. Verifica la conexión.');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.storageInfo?.url;
    link.download = file.originalName;
    link.target = '_blank';
    link.click();
  };

  const skipForward = () => {
    audioRef.current.currentTime += 10;
  };

  const skipBackward = () => {
    audioRef.current.currentTime -= 10;
  };

  return (
    <div className="audio-player-overlay">
      <div className="audio-player-container">
        <div className="audio-player-header">
          <div className="audio-player-info">
            <h3 className="audio-title">{file.originalName}</h3>
            <p className="audio-subtitle">🎵 Reproduciendo audio • {formatTime(duration)}</p>
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
              ✕
            </button>
          </div>
        </div>

        <div className="audio-player-content">
          <div className="audio-visualization">
            <div className="sound-waves">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="sound-bar"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
                />
              ))}
            </div>
          </div>

          <audio
            ref={audioRef}
            src={file.storageInfo?.url}
            preload="metadata"
            className="audio-element"
          />
        </div>

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
            />
            <span className="time-display total-time">{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="control-buttons">
            <div className="playback-controls">
              <button className="control-btn skip-btn" onClick={skipBackward} title="Retroceder 10s">
                <SkipBack className="control-icon" />
              </button>
              
              <button className="play-pause-btn" onClick={togglePlay}>
                {isPlaying ? <Pause className="play-icon" /> : <Play className="play-icon" />}
              </button>
              
              <button className="control-btn skip-btn" onClick={skipForward} title="Avanzar 10s">
                <SkipForward className="control-icon" />
              </button>
            </div>

            <div className="volume-controls">
              <button className="control-btn volume-btn" onClick={toggleMute}>
                {isMuted ? <VolumeX className="control-icon" /> : <Volume2 className="control-icon" />}
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

          <div className="audio-player-footer">
            <span className="storage-info">
              {file.storageInfo?.storageType === 's3' ? '☁️ Streaming desde AWS S3' : '💻 Archivo local'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;