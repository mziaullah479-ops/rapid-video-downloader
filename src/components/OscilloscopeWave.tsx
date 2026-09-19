import React, { useEffect, useRef } from 'react';

interface OscilloscopeWaveProps {
  speedMBps: number;
  active: boolean;
}

export const OscilloscopeWave: React.FC<OscilloscopeWaveProps> = ({ speedMBps, active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid lines
      ctx.strokeStyle = 'rgba(0, 255, 213, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 10; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw primary wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffd5';
      ctx.shadowColor = '#00ffd5';
      ctx.shadowBlur = active ? 8 : 0;

      const midY = height / 2;
      const waveAmplitude = active ? Math.min(22, 6 + speedMBps * 1.5) : 3;
      const frequency = 0.035;

      for (let x = 0; x < width; x++) {
        // Multi-frequency synthesis for realistic packet burst waveform
        const y1 = Math.sin(x * frequency + phase) * waveAmplitude;
        const y2 = Math.cos(x * frequency * 2.1 - phase * 1.4) * (waveAmplitude * 0.4);
        const y3 = Math.sin(x * 0.08 + phase * 3) * (waveAmplitude * 0.15);
        
        // Edge dampening
        const edgeDamp = Math.sin((x / width) * Math.PI);
        const y = midY + (y1 + y2 + y3) * edgeDamp;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Subtle glow shadow fill underneath
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, midY - 20, 0, height);
      gradient.addColorStop(0, 'rgba(0, 255, 213, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 255, 213, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Update phase
      phase += active ? 0.08 : 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [speedMBps, active]);

  return (
    <div className="w-full bg-[#04151b] border border-[#00ffd5]/20 rounded-xl p-2 relative overflow-hidden">
      <div className="flex justify-between items-center text-[10px] font-mono-cyber text-[#00ffd5]/60 mb-1 px-1">
        <span>DATA STREAM FREQ // 2.4 GHz</span>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#00ffd5] animate-pulse' : 'bg-gray-600'}`} />
          {active ? 'LIVE PACKETS' : 'BUFFER STANDBY'}
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={340} 
        height={64} 
        className="w-full h-16 block rounded"
      />
    </div>
  );
};
