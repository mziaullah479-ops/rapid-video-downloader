import React, { useEffect, useRef } from 'react';

export const CyberBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating cyber data particles
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.2 + Math.random() * 0.5,
      size: 1 + Math.random() * 2,
      char: ['0', '1', '>', '#', 'λ', '::', '√'][Math.floor(Math.random() * 7)],
      opacity: 0.1 + Math.random() * 0.25
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle cyan matrix particles
      ctx.font = '10px monospace';
      particles.forEach(p => {
        ctx.fillStyle = `rgba(0, 255, 213, ${p.opacity})`;
        ctx.fillText(p.char, p.x, p.y);

        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cyber-grid opacity-75" />

      {/* Radial ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00ffd5]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-[#00e599]/5 blur-[120px] rounded-full" />

      {/* Scanline texture */}
      <div className="absolute inset-0 scanlines opacity-30" />

      {/* Canvas for floating cyber tokens */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
    </div>
  );
};
