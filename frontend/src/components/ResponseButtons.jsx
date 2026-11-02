import React, { useEffect } from 'react';
import { Check, ThumbsUp, HelpCircle, ThumbsDown, X, RotateCcw } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export default function ResponseButtons({
  onAnswer,
  onUndo,
  canUndo = false,
  disabled = false,
  historyCount = 0,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;
      const key = e.key.toLowerCase();
      if (e.key === '1' || key === 'y') {
        handleClick('yes');
      } else if (e.key === '2' || key === 'p') {
        handleClick('probably');
      } else if (e.key === '3' || key === 'd') {
        handleClick('dont_know');
      } else if (e.key === '4') {
        handleClick('probably_not');
      } else if (e.key === '5' || key === 'n') {
        handleClick('no');
      } else if ((key === 'z' || key === 'u') && canUndo) {
        handleUndoClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnswer, onUndo, canUndo, disabled]);

  const handleClick = (value) => {
    soundEffects.playClick();
    onAnswer(value);
  };

  const handleUndoClick = () => {
    soundEffects.playWhoosh();
    onUndo();
  };

  const buttons = [
    {
      id: 'yes',
      label: 'Yes',
      keyHint: '1',
      icon: <Check className="w-5 h-5 text-emerald-400" />,
      borderGlow: 'hover:border-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:bg-emerald-950/40 text-emerald-300',
      badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
    },
    {
      id: 'probably',
      label: 'Probably / Partially',
      keyHint: '2',
      icon: <ThumbsUp className="w-4 h-4 text-cyan-400" />,
      borderGlow: 'hover:border-cyan-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:bg-cyan-950/40 text-cyan-300',
      badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60',
    },
    {
      id: 'dont_know',
      label: "Don't Know / Irrelevant",
      keyHint: '3',
      icon: <HelpCircle className="w-4 h-4 text-violet-300" />,
      borderGlow: 'hover:border-violet-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:bg-violet-950/40 text-violet-300',
      badgeBg: 'bg-violet-950/80 text-violet-400 border-violet-700/60',
    },
    {
      id: 'probably_not',
      label: 'Probably Not',
      keyHint: '4',
      icon: <ThumbsDown className="w-4 h-4 text-amber-400" />,
      borderGlow: 'hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:bg-amber-950/40 text-amber-300',
      badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
    },
    {
      id: 'no',
      label: 'No',
      keyHint: '5',
      icon: <X className="w-5 h-5 text-rose-400" />,
      borderGlow: 'hover:border-rose-500 hover:shadow-[0_0_25px_rgba(244,63,94,0.4)] hover:bg-rose-950/40 text-rose-300',
      badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-700/60',
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2">
      {/* 5 Response Buttons */}
      <div className="flex flex-col gap-2.5">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleClick(btn.id)}
            disabled={disabled}
            className={`w-full py-3.5 px-5 rounded-2xl border border-slate-700/80 bg-slate-900/75 backdrop-blur-md font-bold text-base flex items-center justify-between transition-all duration-200 transform active:scale-[0.98] cursor-pointer shadow-lg group ${btn.borderGlow} disabled:opacity-50 disabled:pointer-events-none`}
          >
            <div className="flex items-center gap-3.5">
              <span className="p-1.5 rounded-xl bg-slate-800/90 group-hover:scale-110 transition-transform shadow-inner">
                {btn.icon}
              </span>
              <span className="tracking-wide font-jakarta">{btn.label}</span>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-bold shadow-sm transition-colors ${btn.badgeBg}`}
            >
              {btn.keyHint}
            </span>
          </button>
        ))}
      </div>

      {/* Undo Button with History Counter */}
      {canUndo && (
        <div className="flex justify-center mt-3.5">
          <button
            onClick={handleUndoClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/50 transition-all duration-200 shadow-md group active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
            <span>Undo Previous Answer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
              Z {historyCount > 0 && `• ${historyCount}`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
