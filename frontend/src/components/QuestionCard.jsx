import React from 'react';
import { Film, Swords, Users, Clock, MapPin, Tag, Music, Sparkles } from 'lucide-react';

export default function QuestionCard({ question, questionNumber = 1 }) {
  if (!question) return null;

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'industry':
        return {
          label: 'Language & Industry',
          icon: <Film className="w-3.5 h-3.5" />,
          color: 'bg-blue-900/60 text-blue-300 border-blue-600/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]',
        };
      case 'plot':
        return {
          label: 'Plot & Conflict',
          icon: <Swords className="w-3.5 h-3.5" />,
          color: 'bg-rose-950/60 text-rose-300 border-rose-600/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        };
      case 'cast':
        return {
          label: 'Starring Cast',
          icon: <Users className="w-3.5 h-3.5" />,
          color: 'bg-amber-950/60 text-amber-300 border-amber-600/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        };
      case 'era':
        return {
          label: 'Decade & Era',
          icon: <Clock className="w-3.5 h-3.5" />,
          color: 'bg-purple-950/60 text-purple-300 border-purple-600/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
        };
      case 'setting':
        return {
          label: 'Location & World',
          icon: <MapPin className="w-3.5 h-3.5" />,
          color: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        };
      case 'music':
        return {
          label: 'Music & Score',
          icon: <Music className="w-3.5 h-3.5" />,
          color: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
        };
      default:
        return {
          label: 'Cinema Trope',
          icon: <Tag className="w-3.5 h-3.5" />,
          color: 'bg-slate-900/80 text-slate-300 border-slate-700 shadow-[0_0_12px_rgba(148,163,184,0.2)]',
        };
    }
  };

  const badge = getCategoryBadge(question.category);

  return (
    <div className="w-full max-w-xl mx-auto px-4 my-2 text-center animate-fadeIn">
      <div className="glass-panel-glow rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 shadow-2xl">
        {/* Top Gold Gradient Trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Decorative corner accent filigrees */}
        <div className="absolute top-2 left-2 text-amber-500/20 text-xs select-none">✦</div>
        <div className="absolute top-2 right-2 text-amber-500/20 text-xs select-none">✦</div>

        {/* Category Pill */}
        <div className="mb-4 inline-block">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border backdrop-blur-md ${badge.color}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight font-jakarta drop-shadow-md">
          "{question.text}"
        </h2>
      </div>
    </div>
  );
}
