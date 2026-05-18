import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState(duration);
  const audioRef = useRef(null);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e) => {
    const seekTo = parseFloat(e.target.value);
    setCurrentTime(seekTo);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTo;
    }
  };

  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec)) return '0:00';
    const m = Math.floor(timeInSec / 60);
    const s = Math.floor(timeInSec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If the audio URL is from Cloudinary and ends with .webm, convert the extension to .mp3 for universal browser playback
  let playableUrl = audioUrl;
  if (playableUrl && playableUrl.includes('res.cloudinary.com') && playableUrl.endsWith('.webm')) {
    playableUrl = playableUrl.replace(/\.webm$/, '.mp3');
  }

  return (
    <div className={`flex items-center gap-3 w-64 sm:w-72 p-1.5 rounded-xl ${isMe ? 'text-white' : 'text-gray-100'}`}>
      <audio 
        ref={audioRef} 
        src={playableUrl || audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration !== Infinity && !duration) {
            setLoadedDuration(Math.floor(audioRef.current.duration));
          }
        }}
      />

      <button 
        onClick={togglePlayPause}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 shrink-0 ${
          isMe 
            ? 'bg-white text-primary hover:bg-gray-100 shadow' 
            : 'bg-primary text-white hover:bg-primary-dark shadow'
        }`}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 w-full">
          <input 
            type="range" 
            min={0}
            max={loadedDuration || 30}
            value={currentTime}
            onChange={handleSeek}
            className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full ${
              isMe 
                ? 'bg-white/30 [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-yellow-300' 
                : 'bg-gray-600 [&::-webkit-slider-thumb]:bg-primary hover:[&::-webkit-slider-thumb]:bg-primary-dark'
            }`}
          />
        </div>

        <div className="flex items-center justify-between mt-1 text-[10px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Mic className="w-3 h-3 opacity-60" />
            <span>{formatTime(loadedDuration || duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
