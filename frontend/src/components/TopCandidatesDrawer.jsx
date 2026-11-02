import React, { useState } from 'react';
import { Eye, EyeOff, Activity, Sparkles, BarChart2 } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export default function TopCandidatesDrawer({ previews = [], entropy = 4.0 }) {
  const [open, setOpen] = useState(false);

  if (!previews || previews.length === 0) return null;

  const handleToggle = () => {
    soundEffects.playClick();
    setOpen(!open);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md overflow-hidden shadow-xl">
        <button
          onClick={handleToggle}
          className="w-full py-3 px-4.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Bayesian Probability Matrix ({previews.length} Candidates)</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{open ? 'Hide Matrix' : 'Inspect Probabilities'}</span>
          </span>
        </button>

        {open && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-3.5 animate-fadeIn">
            <div className="text-[11px] text-slate-400 flex justify-between items-center pb-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1 font-mono">
                Entropy: <strong className="text-amber-400 font-bold">{entropy}</strong> bits
              </span>
              <span className="text-slate-500 italic">Priors updated via Bayes' Theorem</span>
            </div>

            <div className="space-y-2.5">
              {previews.map((cand, idx) => {
                const p = Math.round(cand.probability * 100);
                return (
                  <div key={cand.id || idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-200">
                      <span className="truncate pr-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        <span>{cand.title}</span>
                        <span className="text-slate-400 font-normal">({cand.year})</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{p}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(3, p)}%`,
                          background:
                            idx === 0
                              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                              : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
