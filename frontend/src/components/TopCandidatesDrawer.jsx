import React, { useState } from 'react';
import { Eye, EyeOff, Activity, BarChart2 } from 'lucide-react';

export default function TopCandidatesDrawer({ previews = [], entropy = 4.0 }) {
  const [open, setOpen] = useState(false);

  if (!previews || previews.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur-sm overflow-hidden shadow-lg">
        <button
          onClick={() => setOpen(!open)}
          className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Live Probability Matrix ({previews.length} Candidates)
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {open ? 'Hide' : 'Inspect'}
          </span>
        </button>

        {open && (
          <div className="p-4 border-t border-slate-800 space-y-3 animate-fadeIn">
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Entropy: <strong className="text-amber-400">{entropy}</strong> bits</span>
              <span>Updated via Bayes Rule</span>
            </div>

            {previews.map((cand) => {
              const p = Math.round(cand.probability * 100);
              return (
                <div key={cand.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-300">
                    <span className="truncate pr-2">{cand.title} ({cand.year})</span>
                    <span className="font-mono text-amber-400">{p}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, p)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
