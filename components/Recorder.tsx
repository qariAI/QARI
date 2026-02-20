
import React, { useState, useRef, useEffect } from 'react';
import Waveform from './Waveform';

interface RecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [mimeType, setMimeType] = useState<string>('audio/webm');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm'; // Fallback
  };

  const startRecording = async () => {
    try {
      // Optimized Audio Constraints for Recitation Analysis
      // We disable autoGainControl and noiseSuppression to preserve breathy consonants (Hams)
      // and dynamic range (Qalqalah), which are often filtered out by default conference settings.
      const audioConstraints = {
        audio: {
          channelCount: 1,
          sampleRate: 48000, // High sample rate for better spectral resolution
          echoCancellation: true, // Keep echo cancellation to reduce speaker feedback
          noiseSuppression: false, // DISABLE to preserve 'Hams' (whisper) qualities
          autoGainControl: false, // DISABLE to prevent warping of loudness dynamics
        }
      };

      const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      setStream(audioStream);

      const type = getSupportedMimeType();
      setMimeType(type);
      
      const mediaRecorder = new MediaRecorder(audioStream, { 
        mimeType: type,
        audioBitsPerSecond: 128000 // Ensure good bitrate
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: type });
        onRecordingComplete(blob);
        const tracks = audioStream.getTracks();
        tracks.forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to use QariAI. Please verify permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStream(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-emerald-100 max-w-md w-full mx-auto">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-serif text-emerald-900 mb-2">
          {isRecording ? "Listening..." : "Start Recitation"}
        </h3>
        <p className="text-emerald-600/70 text-sm">
          {isRecording ? formatTime(duration) : "Tap the microphone to begin"}
        </p>
      </div>

      <div className="mb-8 h-16 w-full flex items-center justify-center">
        {isRecording ? (
          <Waveform isRecording={isRecording} stream={stream} />
        ) : (
          <div className="text-emerald-200">
             {/* Simple icon placeholder */}
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        )}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          group relative flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-300
          ${isRecording 
            ? 'bg-red-50 hover:bg-red-100 border-2 border-red-500' 
            : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 border-4 border-emerald-200'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isRecording ? (
          <div className="w-8 h-8 bg-red-500 rounded-md shadow-sm" />
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {isProcessing && (
         <p className="mt-6 text-sm text-emerald-600 animate-pulse">Analyzing Recitation...</p>
      )}
    </div>
  );
};

export default Recorder;
