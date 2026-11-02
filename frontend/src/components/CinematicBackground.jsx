import React, { useEffect, useRef } from 'react';

export default function CinematicBackground({ confidence = 0.05, gameState = 'welcome' }) {
  const canvasRef = useRef(null);

  // Dynamic Aura color schemes
  const getAuraColors = () => {
    if (gameState === 'victory') {
      return {
        primary: 'rgba(16, 185, 129, 0.28)',   // Emerald
        secondary: 'rgba(245, 158, 11, 0.25)', // Gold
        accent: 'rgba(5, 150, 105, 0.15)',
      };
    }
    if (gameState === 'defeat') {
      return {
        primary: 'rgba(147, 51, 234, 0.28)',   // Purple
        secondary: 'rgba(225, 29, 72, 0.20)',  // Rose
        accent: 'rgba(79, 70, 229, 0.15)',
      };
    }
    if (gameState === 'playing') {
      if (confidence >= 0.75) {
        return {
          primary: 'rgba(225, 29, 72, 0.30)',   // Fiery Crimson
          secondary: 'rgba(245, 158, 11, 0.30)', // Amber
          accent: 'rgba(220, 38, 38, 0.20)',
        };
      }
      if (confidence >= 0.35) {
        return {
          primary: 'rgba(245, 158, 11, 0.25)',  // Warm Amber
          secondary: 'rgba(234, 88, 12, 0.20)', // Orange
          accent: 'rgba(217, 119, 6, 0.15)',
        };
      }
      return {
        primary: 'rgba(59, 130, 246, 0.20)',   // Mystic Sapphire
        secondary: 'rgba(139, 92, 246, 0.22)', // Indigo/Purple
        accent: 'rgba(37, 99, 235, 0.12)',
      };
    }

    // Default welcome
    return {
      primary: 'rgba(124, 58, 237, 0.22)',    // Violet
      secondary: 'rgba(245, 158, 11, 0.20)',  // Amber gold
      accent: 'rgba(59, 130, 246, 0.15)',
    };
  };

  const aura = getAuraColors();

  // Floating Starfield & Cinema Dust Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate floating golden dust motes
    const particleCount = Math.min(65, Math.floor(width / 22));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.4 + 0.15),
      vx: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.7 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      pulsePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? 'gold' : 'blue',
    }));

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw each particle
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.pulsePhase += p.pulseSpeed;

        // Wrap around top/bottom/sides
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulsePhase) * 0.25);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.color === 'gold') {
          ctx.fillStyle = `rgba(251, 191, 36, ${currentAlpha})`;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
          ctx.shadowBlur = p.radius * 3;
        } else {
          ctx.fillStyle = `rgba(147, 197, 253, ${currentAlpha * 0.8})`;
          ctx.shadowColor = 'rgba(96, 165, 250, 0.4)';
          ctx.shadowBlur = p.radius * 2;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Ambient Auras (Smooth Transitioning) */}
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[550px] md:w-[900px] md:h-[650px] rounded-full blur-[130px] transition-colors duration-1000 ease-out"
        style={{ backgroundColor: aura.primary }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 ease-out"
        style={{ backgroundColor: aura.secondary }}
      />
      <div
        className="absolute top-[40%] left-[-10%] w-[450px] h-[450px] rounded-full blur-[110px] transition-colors duration-1000 ease-out"
        style={{ backgroundColor: aura.accent }}
      />

      {/* Center Spotlight Cone */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 45%, transparent 75%)',
        }}
      />

      {/* Floating Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

      {/* Cinematic Theater Vignette & Curtains Edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 40%, rgba(5, 7, 13, 0.5) 75%, rgba(4, 5, 10, 0.95) 100%)',
        }}
      />
    </div>
  );
}
