import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Minimize2, Maximize2, Music, ListMusic, Power, Loader2, Upload } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import api from '../services/api';

const CLOUDINARY_SONGS = [
  { name: 'Maname Maname', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081139/Maname_Maname_ius6de.mp3' },
  { name: 'Oruthi', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081137/Oruthi_xvix1d.mp3' },
  { name: 'Kadhal Adhu Poi', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081133/Kadhal_Adhu_Poi_dqojwl.mp3' },
  { name: 'Paintball Song 1', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081124/Paintball_song_1_f9sdme.mp3' },
  { name: 'Paintball Song 2', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081120/Paintball_song_hbnqxf.mp3' },
  { name: 'Iraivaa', url: 'https://res.cloudinary.com/dghiee3a4/video/upload/q_auto/f_auto/v1779081103/Iraivaa_whaklj.mp3' }
];

const GlobalMusicPlayer = () => {
  const {
    audioRef, currentSongUrl, currentSongName, isPlaying,
    volume, setVolume, playSong, pauseSong, seekSong, duration, roomId, changeSong, leaveMusicRoom,
    isMinimized, setIsMinimized, friendDisconnected
  } = useMusic();

  const [currentTime, setCurrentTime] = useState(0);
  const [localVolume, setLocalVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [songs, setSongs] = useState(CLOUDINARY_SONGS);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const playlistRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch Cloudinary songs when room opens
  useEffect(() => {
    if (!roomId) return;
    const fetchSongs = async () => {
      setIsLoadingSongs(true);
      try {
        const { data } = await api.get('/upload/songs');
        if (data && data.length > 0) {
          setSongs(data);
        }
      } catch (error) {
        console.error('Failed to fetch Cloudinary songs:', error);
      } finally {
        setIsLoadingSongs(false);
      }
    };
    fetchSongs();
  }, [roomId]);

  const handleUploadSong = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('song', file);

    try {
      const { data } = await api.post('/upload/song', formData);
      const newSong = { name: data.name, url: data.songUrl };
      setSongs((prev) => [newSong, ...prev]);
      changeSong(newSong.url, newSong.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload audio file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Close playlist when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (playlistRef.current && !playlistRef.current.contains(event.target)) {
        setShowPlaylist(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Local timer to update progress bar smoothly
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audioRef]);

  // Handle local sync when seeking from elsewhere
  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime);
    };
    const audio = audioRef.current;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [audioRef]);

  // Handle auto-play next song when current song finishes
  useEffect(() => {
    const handleEnded = () => {
      if (!songs || songs.length === 0) return;
      const currentIndex = songs.findIndex((s) => s.url === currentSongUrl);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % songs.length;
        const nextSong = songs[nextIndex];
        if (nextSong) {
          changeSong(nextSong.url, nextSong.name);
        }
      }
    };
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [songs, currentSongUrl, changeSong, audioRef]);

  const handlePlayPause = () => {
    if (!currentSongUrl) return;
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    seekSong(time);
  };

  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setLocalVolume(vol);
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(localVolume);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If no room is joined, don't show the player
  if (!roomId) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-14 h-14 ${friendDisconnected ? 'bg-amber-500 hover:bg-amber-600 animate-bounce ring-4 ring-amber-500/50' : 'bg-primary hover:bg-primary-dark'} text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 relative`}
          title={friendDisconnected ? 'Friend Disconnected (Click to open)' : 'Open Music Player'}
        >
          {friendDisconnected && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[10px] items-center justify-center font-bold text-white shadow">!</span>
            </span>
          )}
          {isPlaying && !friendDisconnected ? (
            <div className="flex gap-1 items-end h-5">
              <span className="w-1 bg-white h-3 animate-pulse"></span>
              <span className="w-1 bg-white h-5 animate-pulse delay-75"></span>
              <span className="w-1 bg-white h-4 animate-pulse delay-150"></span>
            </div>
          ) : (
            <Music className="w-6 h-6" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-auto md:h-24 py-3 md:py-0 bg-[#181818] border-t border-[#282828] text-white z-50 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 shadow-lg gap-3 md:gap-0 animate-in slide-in-from-bottom-5">

      {/* Left: Song Info */}
      <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-1/4 min-w-0 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#282828] rounded flex items-center justify-center shrink-0 group relative">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:opacity-0 transition-opacity" />
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded"
              title="Open Playlist"
            >
              <ListMusic className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="min-w-0 overflow-hidden">
            <h4
              className="text-xs md:text-sm font-semibold truncate hover:underline cursor-pointer"
              onClick={() => setShowPlaylist(!showPlaylist)}
              title="Click to select a song"
            >
              {currentSongName || 'Click to select a song'}
            </h4>
            <div className="flex items-center gap-2">
              <p className="text-[10px] md:text-xs text-gray-400 truncate">VibeChat Sync</p>
              {friendDisconnected && (
                <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shrink-0">
                  ⚠️ Friend Left
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to disconnect?")) leaveMusicRoom();
            }}
            className="p-2 text-red-500 hover:text-red-400 bg-red-500/10 rounded-full"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* Playlist Popup */}
        {showPlaylist && (
          <div ref={playlistRef} className="absolute bottom-[60px] md:bottom-[80px] left-0 w-[calc(100vw-32px)] md:w-72 max-w-sm bg-[#282828] border border-[#3e3e3e] rounded-xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2">
            <div className="px-3 py-2 border-b border-[#3e3e3e] mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Your Cloudinary Songs</h3>
              <ListMusic className="w-4 h-4 text-gray-400" />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {isLoadingSongs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                songs.map((song, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      changeSong(song.url, song.name);
                      setShowPlaylist(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs md:text-sm truncate transition-colors ${currentSongUrl === song.url
                        ? 'bg-primary text-white font-medium shadow-sm'
                        : 'text-gray-300 hover:bg-[#3e3e3e] hover:text-white'
                      }`}
                  >
                    {song.name}
                  </button>
                ))
              )}

              <div className="h-px bg-[#3e3e3e] my-2"></div>

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadSong}
                  accept="audio/*"
                  className="hidden"
                  id="song-upload"
                />
                <label
                  htmlFor="song-upload"
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium border border-dashed border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>+ Upload Track</span>
                    </>
                  )}
                </label>
              </div>

              <button
                onClick={() => {
                  const url = window.prompt("Enter direct Cloudinary MP3 URL:");
                  if (url) {
                    changeSong(url, "Custom Track");
                    setShowPlaylist(false);
                  }
                }}
                className="w-full text-left px-3 py-2 mt-1 rounded-lg text-[11px] text-gray-400 hover:text-white hover:bg-[#3e3e3e] transition-colors italic text-center block"
              >
                + Paste Direct URL...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center: Controls & Progress */}
      <div className="flex flex-col items-center w-full md:w-2/4 max-w-2xl gap-1.5 md:gap-2">
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors disabled:opacity-30" disabled={!currentSongUrl}>
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>

          <button
            onClick={handlePlayPause}
            disabled={!currentSongUrl}
            className="w-8 h-8 md:w-9 md:h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button className="text-gray-400 hover:text-white transition-colors disabled:opacity-30" disabled={!currentSongUrl}>
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          </button>
        </div>

        <div className="flex items-center w-full gap-2 md:gap-3 text-[11px] md:text-xs text-gray-400 px-2 md:px-0">
          <span className="w-8 md:w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentSongUrl}
            className="flex-1 h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="w-8 md:w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Minimize (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : localVolume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-[#4d4d4d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white transition-colors ml-4"
          title="Minimize Player"
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to disconnect from this music session?")) {
              leaveMusicRoom();
            }
          }}
          className="text-red-500 hover:text-red-400 hover:scale-110 transition-all ml-2 bg-red-500/10 p-2 rounded-full"
          title="Disconnect / Leave Session"
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default GlobalMusicPlayer;
