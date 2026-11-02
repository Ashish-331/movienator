import React from 'react';
import { Film, Swords, Users, Clock, MapPin, Tag } from 'lucide-react';

export default function QuestionCard({ question, questionNumber = 1 }) {
  if (!question) return null;

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'industry':
        return { label: 'Industry & Language', icon: <Film className="w-3.5 h-3.5" />, color: 'bg-blue-900/60 text-blue-300 border-blue-700/60' };
      case 'plot':
        return { label: 'Plot & Conflict', icon: <Swords className="w-3.5 h-3.5" />, color: 'bg-red-900/60 text-red-300 border-red-700/60' };
      case 'cast':
        return { label: 'Starring Cast', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-amber-900/60 text-amber-300 border-amber-700/60' };
      case 'era':
        return { label: 'Era & Decade', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-purple-900/60 text-purple-300 border-purple-700/60' };
      case 'setting':
        return { label: 'Location & Setting', icon: <MapPin className="w-3.5 h-3.5" />, color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60' };
      default:
        return { label: 'Cinema Trope', icon: <Tag className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getCategoryBadge(question.category);

  return (
    <div className="w-full max-w-xl mx-auto px-4 my-3 text-center">
      <div className="glass-card rounded-2xl p-6 md:p-8 transition-all duration-300 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Top subtle glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />

        {/* Category Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border uppercase mb-4 backdrop-blur-md shadow-sm">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${badge.color}`}>
            {badge.icon}
            {badge.label}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug tracking-tight">
          "{question.text}"
        </h2>
      </div>
    </div>
  );
}
