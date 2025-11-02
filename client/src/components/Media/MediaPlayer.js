// client/src/components/Media/MediaPlayer.js
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Download, Music } from 'lucide-react';
import './MediaPlayer.css';

const MediaPlayer = ({ file, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      const updateTime = () => setCurrentTime(media.currentTime);
      const updateDuration = () => setDuration(media.duration);
      const handleEnded = () => setIsPlaying(false);
      
      media.addEventListener('timeupdate', updateTime);
      media.addEventListener('loadedmetadata', updateDuration);
      media.addEventListener('ended', handleEnded);
      
      return () => {
        media.removeEventListener('timeupdate', updateTime);
        media.removeEventListener('loadedmetadata', updateDuration);
        media.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (mediaRef.current) {
      mediaRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  return (
    <div className="media-player-overlay">
      <div className="media-player-container">
        {/* Header */}
        <div className="media-player-header">
          <div className="media-player-title">
            <h3>{file.originalName}</h3>
            <p>
              {file.fileType === 'audio' ? '🎵 Audio' : '🎬 Video'} • {formatTime(duration)}
            </p>
          </div>
          <div className="media-player-actions">
            <button 
              onClick={handleDownload}
              className="media-player-button"
              title="Descargar"
            >
              <Download className="icon" />
            </button>
            <button 
              onClick={onClose}
              className="media-player-button"
            >
              <X className="icon" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="media-player-content">
          {file.fileType === 'audio' ? (
            <div className="audio-player">
              <div className="audio-icon">
                <Music className="music-icon" />
              </div>
              <audio
                ref={mediaRef}
                src={file.storageInfo?.url}
                className="audio-element"
              />
            </div>
          ) : (
            <video
              ref={mediaRef}
              src={file.storageInfo?.url}
              className="video-element"
              controls={false}
            />
          )}
        </div>

        {/* Controls */}
        <div className="media-player-controls">
          {/* Progress Bar */}
          <div className="progress-bar-container">
            <span className="time current-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <span className="time duration">{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="controls-container">
            <div className="playback-controls">
              <button
                onClick={togglePlay}
                className="play-button"
              >
                {isPlaying ? <Pause className="icon" /> : <Play className="icon" />}
              </button>

              <div className="volume-controls">
                <button 
                  onClick={toggleMute}
                  className="volume-button"
                >
                  {isMuted ? <VolumeX className="icon" /> : <Volume2 className="icon" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-bar"
                />
              </div>
            </div>

            <div className="storage-info">
              {file.storageInfo?.storageType === 's3' ? '☁️ AWS S3' : '💻 Local'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;