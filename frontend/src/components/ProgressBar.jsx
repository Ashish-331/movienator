import React from 'react';
import { BrainCircuit, Zap, Activity } from 'lucide-react';

export default function ProgressBar({
  currentStep = 1,
  maxSteps = 25,
  confidence = 0.05,
  entropy = 4.0,
}) {
  const percent = Math.min(100, Math.round(confidence * 100));

  // Determine stage description
  const getStageLabel = () => {
    if (confidence >= 0.75) return 'Final Deduction';
    if (confidence >= 0.40) return 'Narrowing Candidates';
    if (currentStep > 1) return 'Filtering Prior Distribution';
    return 'Initial Entropy';
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      {/* Metrics Row */}
      <div className="flex justify-between items-center text-xs md:text-sm mb-1.5 font-medium">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold font-jakarta">
          <BrainCircuit className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Question <strong className="text-white">#{currentStep}</strong></span>
          <span className="text-slate-500 font-normal">/ {maxSteps}</span>
        </span>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-slate-400" title="Bayesian Shannon Entropy in bits">
            <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Entropy: <strong className="text-slate-200 font-mono">{entropy}</strong></span>
          </span>

          <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{percent}% Certainty</span>
          </span>
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="relative w-full h-3.5 bg-slate-950/90 rounded-full p-0.5 border border-slate-700/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(245,158,11,0.6)]"
          style={{
            width: `${Math.max(4, percent)}%`,
            background:
              confidence >= 0.75
                ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 70%, #f43f5e 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #f59e0b 60%, #fbbf24 100%)',
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-white/20 animate-pulse" />

          {/* Glowing Head Point */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </div>
      </div>

      {/* Subtitle helper */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 px-1">
        <span>{getStageLabel()}</span>
        <span>Target: &gt;80% certainty</span>
      </div>
    </div>
  );
}
