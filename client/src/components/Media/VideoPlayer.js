// client/src/components/Media/VideoPlayer.js
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Download, X } from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    // Auto-hide controls
    const resetControlsTimeout = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    video.addEventListener('mousemove', resetControlsTimeout);
    video.addEventListener('touchstart', resetControlsTimeout);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('mousemove', resetControlsTimeout);
      video.removeEventListener('touchstart', resetControlsTimeout);
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('Error reproduciendo video:', error);
        alert('❌ Error al reproducir el video. Verifica la conexión.');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    videoRef.current.currentTime = newTime;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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

  const handleVideoClick = () => {
    togglePlay();
  };

  return (
    <div className="video-player-overlay">
      <div className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className={`video-controls-header ${showControls ? 'visible' : 'hidden'}`}>
          <div className="video-player-info">
            <h3 className="video-title">{file.originalName}</h3>
            <p className="video-subtitle">🎬 Reproduciendo video • {formatTime(duration)}</p>
          </div>
          <div className="video-player-actions">
            <button 
              onClick={handleDownload}
              className="video-action-btn"
              title="Descargar"
            >
              <Download className="video-icon" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="video-action-btn"
              title="Pantalla completa"
            >
              <Maximize2 className="video-icon" />
            </button>
            <button 
              onClick={onClose}
              className="video-action-btn close-btn"
            >
              <X className="video-icon" />
            </button>
          </div>
        </div>

        <div className="video-player-content">
          <video
            ref={videoRef}
            src={file.storageInfo?.url}
            className="video-element"
            onClick={handleVideoClick}
            controls={false}
          />
          
          {/* Big Play/Pause Button */}
          <div className={`center-controls ${showControls ? 'visible' : 'hidden'}`}>
            <button className="big-play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause className="big-play-icon" /> : <Play className="big-play-icon" />}
            </button>
          </div>
        </div>

        <div className={`video-player-controls ${showControls ? 'visible' : 'hidden'}`}>
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
              <button className="control-btn play-pause-btn" onClick={togglePlay}>
                {isPlaying ? <Pause className="control-icon" /> : <Play className="control-icon" />}
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

            <div className="video-info">
              <span className="storage-info">
                {file.storageInfo?.storageType === 's3' ? '☁️ AWS S3' : '💻 Local'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;