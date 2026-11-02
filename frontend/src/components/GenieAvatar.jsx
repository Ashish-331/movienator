import React from 'react';

export default function GenieAvatar({ mood = 'neutral', confidence = 0.1 }) {
  // Determine state based on mood or confidence
  let state = mood;
  if (mood === 'dynamic') {
    if (confidence >= 0.75) state = 'confident';
    else if (confidence >= 0.40) state = 'curious';
    else state = 'thinking';
  }

  return (
    <div className="relative flex flex-col items-center justify-center my-2">
      {/* Glow Aura */}
      <div 
        className={`absolute w-36 h-36 rounded-full transition-all duration-700 blur-2xl ${
          state === 'celebration' 
            ? 'bg-amber-400/40 scale-125' 
            : state === 'confident' 
            ? 'bg-amber-500/30 scale-110' 
            : state === 'stumped'
            ? 'bg-purple-500/30'
            : 'bg-blue-500/20 scale-95'
        }`}
      />

      {/* SVG Avatar Container */}
      <div className="relative z-10 w-32 h-32 md:w-36 md:h-36 animate-float transition-transform duration-500">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="turbanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="jewelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>

          {/* Genie Mystical Smoke Base */}
          <path 
            d="M 100 170 C 80 185 60 190 75 198 C 90 205 130 195 125 185 C 120 175 105 175 100 170 Z" 
            fill="#3b82f6" 
            opacity="0.6"
          />

          {/* Torso & Golden Vest */}
          <ellipse cx="100" cy="155" rx="35" ry="25" fill="#1e3a8a" />
          <path d="M 80 140 L 75 175 L 90 175 L 95 145 Z" fill="#f59e0b" />
          <path d="M 120 140 L 125 175 L 110 175 L 105 145 Z" fill="#f59e0b" />
          {/* Gold Medallion */}
          <circle cx="100" cy="155" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />

          {/* Genie Face Base */}
          <circle cx="100" cy="105" r="38" fill="url(#skinGrad)" />
          {/* Pointy Genie Ears */}
          <path d="M 64 100 C 50 90 52 112 65 110 Z" fill="#3b82f6" />
          <path d="M 136 100 C 150 90 148 112 135 110 Z" fill="#3b82f6" />
          {/* Gold Earring */}
          <circle cx="145" cy="107" r="4" fill="none" stroke="#fbbf24" strokeWidth="2" />

          {/* Indian Cinema Royal Turban (Pagri) */}
          <path 
            d="M 60 90 C 60 55 140 55 140 90 C 130 70 70 70 60 90 Z" 
            fill="url(#turbanGrad)" 
          />
          <path 
            d="M 62 82 C 75 60 125 60 138 82 C 125 72 75 72 62 82 Z" 
            fill="#d97706" 
          />
          {/* Feather & Ruby Brooch (Kalgi) */}
          <path d="M 100 65 Q 98 40 106 32 Q 104 50 100 65" fill="#f8fafc" />
          <ellipse cx="100" cy="68" rx="6" ry="8" fill="url(#jewelGrad)" stroke="#fbbf24" strokeWidth="2" />

          {/* Eyes & Eyebrows by Mood */}
          {state === 'thinking' && (
            <>
              {/* Curious Eyebrows */}
              <path d="M 80 92 Q 88 88 94 93" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 106 93 Q 112 85 120 89" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Looking up eyes */}
              <circle cx="87" cy="98" r="4" fill="#0f172a" />
              <circle cx="113" cy="98" r="4" fill="#0f172a" />
              <circle cx="88" cy="96" r="1.5" fill="#ffffff" />
              <circle cx="114" cy="96" r="1.5" fill="#ffffff" />
              {/* Pensive mouth */}
              <path d="M 94 122 Q 100 120 106 122" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {state === 'curious' && (
            <>
              <path d="M 78 92 Q 88 86 95 90" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 105 90 Q 112 86 122 92" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="87" cy="100" r="4" fill="#0f172a" />
              <circle cx="113" cy="100" r="4" fill="#0f172a" />
              {/* Smirking mouth */}
              <path d="M 92 120 Q 102 126 110 119" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}

          {state === 'confident' && (
            <>
              {/* Confident hero sunglasses! */}
              <path d="M 74 94 Q 88 92 97 97 L 97 106 Q 88 112 74 104 Z" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />
              <path d="M 103 97 Q 112 92 126 94 L 126 104 Q 112 112 103 106 Z" fill="#09090b" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="97" y1="99" x2="103" y2="99" stroke="#f59e0b" strokeWidth="2" />
              {/* Confident Bollywood grin */}
              <path d="M 90 120 Q 100 130 112 120" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}

          {state === 'celebration' && (
            <>
              <path d="M 80 96 Q 87 90 94 96" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 106 96 Q 113 90 120 96" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Big Joyful Smile */}
              <path d="M 86 116 Q 100 132 114 116 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
              <path d="M 90 117 Q 100 123 110 117" fill="#ffffff" />
            </>
          )}

          {state === 'stumped' && (
            <>
              <path d="M 78 88 Q 87 93 94 91" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 106 91 Q 113 93 122 88" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="86" cy="100" r="5" fill="#0f172a" />
              <circle cx="114" cy="100" r="5" fill="#0f172a" />
              {/* Surprised O mouth */}
              <ellipse cx="100" cy="122" rx="6" ry="8" fill="#0f172a" />
            </>
          )}

          {/* Bollywood Mustachio (Iconic Masala Style) */}
          <path 
            d="M 100 116 C 92 113 86 117 80 115 C 85 119 95 120 100 117 C 105 120 115 119 120 115 C 114 117 108 113 100 116 Z" 
            fill="#1e293b" 
          />
        </svg>
      </div>

      {/* Floating Status Badge */}
      <div className="mt-2 text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-amber-400 backdrop-blur-md">
        {state === 'confident' ? '✨ CineGenie is close!' : state === 'celebration' ? '🎉 Deduced!' : state === 'stumped' ? '🤯 You Stumped Me!' : '🤔 CineGenie is thinking...'}
      </div>
    </div>
  );
}
