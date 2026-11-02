import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Clapperboard, User } from 'lucide-react';

export default function GuessModal({ movie, confidence = 0.9, onConfirm, onReject }) {
  if (!movie) return null;

  const percent = Math.min(100, Math.round(confidence * 100));

  useEffect(() => {
    // Soft celebration burst
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#ef4444', '#3b82f6'],
    });
  }, []);

  const handleYes = () => {
    // Grand celebration burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6'],
    });
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-lg w-full rounded-2xl p-6 md:p-8 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300" />

        {/* Badge */}
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Award className="w-4 h-4 text-amber-400" />
            CineGenie's Deduction ({percent}% Certainty)
          </span>
          <h3 className="text-sm text-slate-400 mt-2">I think of the movie you have in mind:</h3>
        </div>

        {/* Movie Showcase Card */}
        <div className="flex flex-col md:flex-row items-center gap-5 my-5 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80">
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-28 h-40 object-cover rounded-lg shadow-xl border border-slate-700 shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-amber-400 tracking-tight font-cinzel">
              {movie.title}
            </h2>
            <div className="text-sm font-semibold text-slate-300 mt-0.5">
              {movie.industry} • <span className="text-amber-500">{movie.year}</span>
            </div>

            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 justify-center md:justify-start">
                <Clapperboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Director: <strong className="text-slate-200">{movie.director}</strong></span>
              </p>
              <p className="flex items-center gap-1.5 justify-center md:justify-start">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Cast: <strong className="text-slate-200">{movie.lead_cast.slice(0, 3).join(', ')}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Confirmation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={handleYes}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5 text-black" />
            Yes, You Got It!
          </button>

          <button
            onClick={onReject}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500 transition-all transform active:scale-95"
          >
            <XCircle className="w-5 h-5 text-rose-400" />
            No, Keep Guessing!
          </button>
        </div>
      </div>
    </div>
  );
}
