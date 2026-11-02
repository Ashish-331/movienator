import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function ProgressBar({ currentStep = 1, maxSteps = 25, confidence = 0.05, entropy = 4.0 }) {
  const percent = Math.min(100, Math.round(confidence * 100));

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      <div className="flex justify-between items-center text-xs md:text-sm text-slate-300 mb-1 font-medium">
        <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
          <BrainCircuit className="w-4 h-4" />
          Question #{currentStep} <span className="text-slate-500 font-normal">/ {maxSteps}</span>
        </span>

        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
          <span>Entropy: <strong className="text-slate-200">{entropy}</strong> bits</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-semibold">{percent}% Confidence</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 relative shadow-[0_0_12px_rgba(245,158,11,0.5)]"
          style={{ width: `${Math.max(5, percent)}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
