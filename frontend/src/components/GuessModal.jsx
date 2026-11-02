import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Clapperboard, User, Sparkles, Film } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export default function GuessModal({ movie, confidence = 0.9, onConfirm, onReject }) {
  if (!movie) return null;

  const percent = Math.min(100, Math.round(confidence * 100));

  useEffect(() => {
    // Initial dramatic fanfare and spotlight confetti
    soundEffects.playChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#ef4444', '#3b82f6', '#10b981'],
    });
  }, []);

  const handleYes = () => {
    soundEffects.playVictory();
    // Grand celebration multi-stage fireworks burst
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ec4899'],
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);

    onConfirm();
  };

  const handleNo = () => {
    soundEffects.playWhoosh();
    onReject();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel-glow max-w-lg w-full rounded-3xl p-6 md:p-8 border border-amber-500/50 shadow-[0_0_80px_rgba(245,158,11,0.3)] relative overflow-hidden">
        {/* Top Golden Light Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300" />

        {/* Ambient Top Spotlight Cone */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-48 pointer-events-none opacity-50 blur-2xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        {/* Header Badge */}
        <div className="text-center mb-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm mb-2">
            <Award className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>CineGenie's Deduction ({percent}% Certainty)</span>
          </div>
          <h3 className="text-sm font-medium text-slate-300">
            By the power of 50,000+ reels, the movie you are thinking of is:
          </h3>
        </div>

        {/* Movie Showcase Display */}
        <div className="flex flex-col sm:flex-row items-center gap-5 my-5 p-4.5 rounded-2xl bg-slate-950/80 border border-amber-500/20 shadow-2xl relative z-10">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-28 h-40 object-cover rounded-xl shadow-2xl border border-amber-500/30 shrink-0 transform hover:scale-105 transition-transform"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-28 h-40 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 shrink-0 flex flex-col items-center justify-center border border-amber-500/30 shadow-2xl text-amber-400">
              <Clapperboard className="w-10 h-10 mb-2 opacity-80" />
              <span className="text-xs font-mono font-bold text-slate-400">{movie.year}</span>
            </div>
          )}

          <div className="flex-1 text-center sm:text-left min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 inline-block mb-1">
              {movie.industry}
            </span>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-cinzel leading-tight">
              {movie.title}
            </h2>

            <div className="text-sm font-bold text-amber-400 mt-1 font-mono">
              Released: {movie.year}
            </div>

            <div className="mt-3.5 text-xs text-slate-400 space-y-1.5">
              {movie.director && (
                <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Clapperboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    Director: <strong className="text-slate-200">{movie.director}</strong>
                  </span>
                </p>
              )}
              {Array.isArray(movie.lead_cast) && movie.lead_cast.length > 0 && (
                <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    Cast: <strong className="text-slate-200">{movie.lead_cast.slice(0, 3).join(', ')}</strong>
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 relative z-10">
          <button
            onClick={handleYes}
            className="flex-1 py-4 px-5 rounded-2xl font-black text-base flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>Yes, You Got It!</span>
          </button>

          <button
            onClick={handleNo}
            className="flex-1 py-4 px-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500/50 shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>No, Keep Guessing!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
