import React, { useEffect } from 'react';
import { Check, ThumbsUp, HelpCircle, ThumbsDown, X, RotateCcw } from 'lucide-react';

export default function ResponseButtons({ onAnswer, onUndo, canUndo = false, disabled = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;
      if (e.key === '1' || e.key.toLowerCase() === 'y') onAnswer('yes');
      else if (e.key === '2' || e.key.toLowerCase() === 'p') onAnswer('probably');
      else if (e.key === '3' || e.key.toLowerCase() === 'd') onAnswer('dont_know');
      else if (e.key === '4') onAnswer('probably_not');
      else if (e.key === '5' || e.key.toLowerCase() === 'n') onAnswer('no');
      else if ((e.key === 'z' || e.key === 'u') && canUndo) onUndo();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnswer, onUndo, canUndo, disabled]);

  const buttons = [
    {
      id: 'yes',
      label: 'Yes',
      keyHint: '1',
      icon: <Check className="w-5 h-5 text-emerald-400" />,
      style: 'hover:border-emerald-500 hover:bg-emerald-950/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-300',
      activeRing: 'focus:ring-emerald-500',
    },
    {
      id: 'probably',
      label: 'Probably / Partially',
      keyHint: '2',
      icon: <ThumbsUp className="w-4 h-4 text-teal-400" />,
      style: 'hover:border-teal-500 hover:bg-teal-950/40 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] text-teal-300',
      activeRing: 'focus:ring-teal-500',
    },
    {
      id: 'dont_know',
      label: "Don't Know",
      keyHint: '3',
      icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
      style: 'hover:border-slate-500 hover:bg-slate-800/60 hover:shadow-[0_0_20px_rgba(148,163,184,0.2)] text-slate-300',
      activeRing: 'focus:ring-slate-400',
    },
    {
      id: 'probably_not',
      label: 'Probably Not',
      keyHint: '4',
      icon: <ThumbsDown className="w-4 h-4 text-amber-400" />,
      style: 'hover:border-amber-500 hover:bg-amber-950/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] text-amber-300',
      activeRing: 'focus:ring-amber-500',
    },
    {
      id: 'no',
      label: 'No',
      keyHint: '5',
      icon: <X className="w-5 h-5 text-rose-400" />,
      style: 'hover:border-rose-500 hover:bg-rose-950/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose-300',
      activeRing: 'focus:ring-rose-500',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2">
      <div className="flex flex-col gap-2.5">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onAnswer(btn.id)}
            disabled={disabled}
            className={`w-full py-3.5 px-5 rounded-xl border border-slate-700/80 bg-slate-900/60 backdrop-blur-md font-semibold text-base flex items-center justify-between transition-all duration-200 transform active:scale-[0.98] ${btn.style} ${btn.activeRing} disabled:opacity-50 disabled:pointer-events-none group shadow-md`}
          >
            <div className="flex items-center gap-3">
              <span className="p-1 rounded-lg bg-slate-800/80 group-hover:scale-110 transition-transform">
                {btn.icon}
              </span>
              <span>{btn.label}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {btn.keyHint}
            </span>
          </button>
        ))}
      </div>

      {/* Undo Button */}
      {canUndo && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onUndo}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo Previous Answer (Z)
          </button>
        </div>
      )}
    </div>
  );
}
