import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

const Waveform: React.FC<WaveformProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isRecording || !stream) return;

    // Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    audioContextRef.current = audioCtx;

    // Create Analyser
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Low FFT size for fewer bars (32 frequency bins)
    analyser.smoothingTimeConstant = 0.5; // Responsive but smooth
    
    // Connect Source
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      // We'll draw 20 bars
      const numBars = 20;
      const totalGap = (numBars - 1) * 3; // 3px gap
      const barWidth = (width - totalGap) / numBars;

      for (let i = 0; i < numBars; i++) {
        // Map bar index to frequency bin. 
        // We skip the very first bin (DC offset usually) and map broadly.
        const binIndex = i + 1; 
        const value = dataArray[binIndex] || 0;
        
        // Calculate height with a minimum threshold
        let barHeight = (value / 255) * height;
        barHeight = Math.max(4, barHeight); // Minimum height 4px

        // Position
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2; // Center vertically

        // Dynamic styling based on loudness
        const intensity = value / 255;
        const opacity = Math.max(0.4, intensity);
        
        // Color gradient feel
        if (intensity > 0.8) ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`; // emerald-500
        else if (intensity > 0.5) ctx.fillStyle = `rgba(52, 211, 153, ${opacity})`; // emerald-400
        else ctx.fillStyle = `rgba(167, 243, 208, ${opacity})`; // emerald-200

        ctx.beginPath();
        const radius = Math.min(barWidth / 2, barHeight / 2);
        
        // Draw rounded rectangle
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
            // Fallback for older browsers
            ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
            ctx.fillRect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={80} 
      className="w-full h-full max-w-[300px]"
    />
  );
};

export default Waveform;