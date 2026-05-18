import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socket';
import useAuthStore from '../store/useAuthStore';

const MusicContext = createContext(null);

export const MusicProvider = ({ children }) => {
  const { user } = useAuthStore();
  const audioRef = useRef(new Audio());
  
  const [currentSongUrl, setCurrentSongUrl] = useState('');
  const [currentSongName, setCurrentSongName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [friendDisconnected, setFriendDisconnected] = useState(false);

  // Use a ref so socket handlers always read the latest value (no stale closures)
  const currentSongUrlRef = useRef('');
  const roomIdRef = useRef(null);

  const updateSongUrl = (url) => {
    currentSongUrlRef.current = url;
    setCurrentSongUrl(url);
  };

  const updateRoomId = (id) => {
    roomIdRef.current = id;
    setRoomId(id);
  };

  // Apply volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle local audio ended
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedData = () => setDuration(audio.duration);
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  // Join / Leave Room Logic
  const joinMusicRoom = useCallback((newRoomId) => {
    if (roomIdRef.current === newRoomId) return; // already in this room
    updateRoomId(newRoomId);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      socket.emit('join-room', { roomId: newRoomId, userId: currentUser._id });
    }
  }, []);

  const leaveMusicRoom = useCallback(() => {
    if (!roomIdRef.current) return;
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      socket.emit('leave-room', { roomId: roomIdRef.current, userId: currentUser._id });
    }
    audioRef.current.pause();
    setIsPlaying(false);
    updateRoomId(null);
    updateSongUrl('');
    setCurrentSongName('');
    setFriendDisconnected(false);
  }, []);

  // Playback Control Methods
  const playSong = useCallback(async (currentTime = null) => {
    if (!roomIdRef.current) return;
    try {
      if (currentTime !== null) audioRef.current.currentTime = currentTime;
      await audioRef.current.play();
      setIsPlaying(true);
      socket.emit('play-song', { roomId: roomIdRef.current, currentTime: audioRef.current.currentTime });
    } catch (error) {
      console.error('Playback failed:', error);
    }
  }, []);

  const pauseSong = useCallback(() => {
    if (!roomIdRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    socket.emit('pause-song', { roomId: roomIdRef.current, currentTime: audioRef.current.currentTime });
  }, []);

  const seekSong = useCallback((time) => {
    if (!roomIdRef.current) return;
    audioRef.current.currentTime = time;
    socket.emit('seek-song', { roomId: roomIdRef.current, currentTime: time });
  }, []);

  const changeSong = useCallback((url, name) => {
    if (!roomIdRef.current) return;
    audioRef.current.src = url;
    updateSongUrl(url);
    setCurrentSongName(name);
    // Auto play when changed
    audioRef.current.play().catch(console.error);
    setIsPlaying(true);
    socket.emit('song-changed', { roomId: roomIdRef.current, songUrl: url, songName: name });
  }, []);

  // Socket Synchronization
  useEffect(() => {
    const handleSyncState = ({ currentSongUrl: sUrl, currentSongName: sName, currentTime, isPlaying: sPlaying }) => {
      if (sUrl !== undefined && sUrl !== currentSongUrlRef.current) {
        audioRef.current.src = sUrl;
        updateSongUrl(sUrl);
        setCurrentSongName(sName);
      }
      
      if (currentTime !== undefined) {
        // Only update if drift is more than 2 seconds to avoid jitter
        if (Math.abs(audioRef.current.currentTime - currentTime) > 2) {
          audioRef.current.currentTime = currentTime;
        }
      }
      
      if (sPlaying !== undefined) {
        setIsPlaying(sPlaying);
        if (sPlaying && audioRef.current.src) {
          audioRef.current.play().catch(console.error);
        } else {
          audioRef.current.pause();
        }
      }
    };

    const handleSongChanged = ({ songUrl, songName }) => {
      audioRef.current.src = songUrl;
      updateSongUrl(songUrl);
      setCurrentSongName(songName);
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    };

    const handlePlay = ({ currentTime }) => {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    };

    const handlePause = ({ currentTime }) => {
      audioRef.current.currentTime = currentTime;
      audioRef.current.pause();
      setIsPlaying(false);
    };

    const handleSeek = ({ currentTime }) => {
      audioRef.current.currentTime = currentTime;
    };

    const handleUserLeft = () => {
      setFriendDisconnected(true);
    };

    const handleReconnect = () => {
      const activeRoom = roomIdRef.current;
      const currentUser = useAuthStore.getState().user;
      if (activeRoom && currentUser) {
        console.log('Socket reconnected – rejoining music room:', activeRoom);
        socket.emit('join-room', { roomId: activeRoom, userId: currentUser._id });
      }
    };

    // Attach listeners
    socket.on('sync-song-state', handleSyncState);
    socket.on('song-changed', handleSongChanged);
    socket.on('play-song', handlePlay);
    socket.on('pause-song', handlePause);
    socket.on('seek-song', handleSeek);
    socket.on('user-left-room', handleUserLeft);
    socket.on('reconnect', handleReconnect);

    // Cleanup listeners
    return () => {
      socket.off('sync-song-state', handleSyncState);
      socket.off('song-changed', handleSongChanged);
      socket.off('play-song', handlePlay);
      socket.off('pause-song', handlePause);
      socket.off('seek-song', handleSeek);
      socket.off('user-left-room', handleUserLeft);
      socket.off('reconnect', handleReconnect);
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        audioRef,
        roomId,
        currentSongUrl,
        currentSongName,
        isPlaying,
        volume,
        duration,
        isMinimized,
        setIsMinimized,
        friendDisconnected,
        setFriendDisconnected,
        setVolume,
        joinMusicRoom,
        leaveMusicRoom,
        playSong,
        pauseSong,
        seekSong,
        changeSong,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
