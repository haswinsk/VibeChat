import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Loader2, Play, Pause, Radio } from 'lucide-react';
import api from '../services/api';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const previewAudioRef = useRef(null);

  const isRecordingRef = useRef(false);

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
    return () => {
      cleanupTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const cleanupTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = {}; // fallback to browser default
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Only increment while actively recording
          if (!isRecordingRef.current) {
            return prev;
          }
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied or not available. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('Error stopping MediaRecorder:', err);
    }
    cleanupTracks();
  };

  const handleCancel = () => {
    stopRecording();
    cleanupTracks();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  };

  const formatTime = (timeInSeconds) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayPausePreview = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleUploadAndSend = async () => {
    if (!audioBlob || isUploading) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_message.webm');
    formData.append('duration', recordingTime);

    try {
      const { data } = await api.post('/upload/audio', formData);
      onSendVoice(data.audioUrl, data.duration);
    } catch (error) {
      console.error('Failed to upload voice note:', error);
      alert('Failed to send voice message. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 w-full bg-dark-surface p-2 sm:p-3 rounded-xl border border-primary/30 animate-in fade-in slide-in-from-bottom-2 shadow-lg">
      {/* Hidden Audio element for preview */}
      {audioUrl && (
        <audio 
          ref={previewAudioRef} 
          src={audioUrl} 
          onEnded={() => setIsPlayingPreview(false)}
          onTimeUpdate={() => setPreviewTime(Math.floor(previewAudioRef.current?.currentTime || 0))}
        />
      )}

      {isRecording ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse shrink-0">
              <Radio className="w-5 h-5 animate-ping absolute" />
              <Mic className="w-5 h-5 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-red-400">Recording voice...</span>
              <span className="text-xs font-mono text-gray-300">{formatTime(recordingTime)} / 1:00</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              className="p-2 sm:p-2.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Trash Recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button 
              onClick={handlePlayPausePreview}
              className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-transform hover:scale-105 shrink-0"
              title={isPlayingPreview ? "Pause" : "Play"}
            >
              {isPlayingPreview ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-white truncate">Voice Note Preview</span>
              <span className="text-xs font-mono text-gray-400">
                {formatTime(isPlayingPreview ? previewTime : recordingTime)} ({recordingTime}s)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              disabled={isUploading}
              className="p-2.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleUploadAndSend}
              disabled={isUploading}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;
