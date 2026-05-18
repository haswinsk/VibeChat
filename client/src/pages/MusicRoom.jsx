import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useRoomStore from '../store/useRoomStore';
import { socket } from '../socket/socket';
import { Play, Pause, SkipForward, SkipBack, Music as MusicIcon, Volume2 } from 'lucide-react';

const MusicRoom = () => {
  const { roomId } = useParams();
  const { room, joinRoom, setRoomState, isLoading } = useRoomStore();
  const [songFile, setSongFile] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    joinRoom(roomId);
  }, [roomId, joinRoom]);

  useEffect(() => {
    if (!room) return;

    socket.on('playSong', ({ currentSong, currentTime }) => {
      setRoomState({ isPlaying: true, currentTime });
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(console.error);
      }
    });

    socket.on('pauseSong', ({ currentTime }) => {
      setRoomState({ isPlaying: false, currentTime });
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.pause();
      }
    });

    socket.on('syncSongTime', ({ currentTime }) => {
      if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 2) {
        audioRef.current.currentTime = currentTime;
      }
    });

    return () => {
      socket.off('playSong');
      socket.off('pauseSong');
      socket.off('syncSongTime');
    };
  }, [room, setRoomState]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setSongFile({ url, name: file.name });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !songFile) return;

    if (room?.isPlaying) {
      audioRef.current.pause();
      setRoomState({ isPlaying: false });
      socket.emit('pauseSong', { roomId: room._id, currentTime: audioRef.current.currentTime });
    } else {
      audioRef.current.play().catch(console.error);
      setRoomState({ isPlaying: true });
      socket.emit('playSong', { 
        roomId: room._id, 
        currentSong: songFile.name, 
        currentTime: audioRef.current.currentTime 
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && room?.isPlaying) {
      // Sync every 5 seconds to reduce socket traffic
      if (Math.floor(audioRef.current.currentTime) % 5 === 0) {
        socket.emit('syncSongTime', { 
          roomId: room._id, 
          currentTime: audioRef.current.currentTime 
        });
      }
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      socket.emit('syncSongTime', { roomId: room._id, currentTime: time });
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        <div className="w-full max-w-2xl bg-dark-surface border border-dark-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Music Room: {room?.roomName || roomId}
            </h2>
            <p className="text-gray-400 mb-8">Vibe together in real-time</p>

            <div className="w-48 h-48 mx-auto bg-dark-bg rounded-2xl flex items-center justify-center mb-8 border border-dark-border shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>
              <MusicIcon className="w-16 h-16 text-primary relative z-10" />
            </div>

            <div className="mb-8">
              {!songFile ? (
                <div>
                  <label className="cursor-pointer bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors inline-block">
                    Select Audio File
                    <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                  </label>
                  <p className="text-sm text-gray-500 mt-3">Only visible to you, audio plays locally but syncs perfectly!</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-medium text-white mb-1 truncate px-4">{songFile.name}</h3>
                  <button onClick={() => setSongFile(null)} className="text-sm text-gray-400 hover:text-white transition-colors">
                    Change Track
                  </button>
                </div>
              )}
            </div>

            {/* Player Controls */}
            <div className="bg-dark-bg p-6 rounded-2xl border border-dark-border">
              {songFile && (
                <audio 
                  ref={audioRef} 
                  src={songFile.url} 
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setRoomState({ isPlaying: false })}
                />
              )}
              
              {/* Progress Bar (simplified) */}
              <div className="mb-6">
                <input 
                  type="range" 
                  min="0" 
                  max={audioRef.current?.duration || 100} 
                  value={audioRef.current?.currentTime || 0}
                  onChange={handleSeek}
                  className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer accent-primary"
                  disabled={!songFile}
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-6">
                <button className="text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!songFile}>
                  <SkipBack className="w-8 h-8" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  disabled={!songFile}
                  className="w-16 h-16 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  {room?.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>
                
                <button className="text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!songFile}>
                  <SkipForward className="w-8 h-8" />
                </button>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default MusicRoom;
