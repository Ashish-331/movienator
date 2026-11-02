import React, { useMemo } from 'react';
import { Sparkles, MessageSquareQuote } from 'lucide-react';

export default function GenieAvatar({
  mood = 'neutral',
  confidence = 0.1,
  questionNumber = 1,
  currentCategory = null,
  customDialogue = null,
}) {
  // Determine avatar facial mood state
  let state = mood;
  if (mood === 'dynamic') {
    if (confidence >= 0.72) state = 'confident';
    else if (confidence >= 0.38) state = 'curious';
    else state = 'thinking';
  }

  // Generate witty, context-aware cinema dialogue lines
  const dialogue = useMemo(() => {
    if (customDialogue) return customDialogue;

    if (state === 'celebration') {
      const victoryLines = [
        "Aha! The archives never lie! What an iconic piece of Indian cinema!",
        "Brilliant taste! The CineGenie’s mind-reading powers strike again!",
        "Masala, magic, and pure cinema! Another deduction added to the legend!",
      ];
      return victoryLines[Math.floor(Math.random() * victoryLines.length)];
    }

    if (state === 'stumped') {
      const defeatLines = [
        "By the power of cinema... You have actually stumped me! Reveal your secret film!",
        "Incredible! A film so elusive even the CineGenie missed its trail! Teach me!",
        "My crystal lamp is baffled! You are a true Indian cinema connoisseur!",
      ];
      return defeatLines[Math.floor(Math.random() * defeatLines.length)];
    }

    if (state === 'confident') {
      const confidentLines = [
        "I already see the posters... I am closing in on your secret film!",
        "Don't blink! The CineGenie has almost unraveled your mystery!",
        "The background score is swelling... Your film cannot escape my sight!",
        "Aha! The probabilities are collapsing into one magnificent movie!",
      ];
      return confidentLines[questionNumber % confidentLines.length];
    }

    if (state === 'curious') {
      if (currentCategory === 'cast') {
        return "I see legendary faces shimmering on the silver screen... Let us check the cast!";
      }
      if (currentCategory === 'plot') {
        return "High-octane drama or emotional tearjerker? Let us dive into the story!";
      }
      if (currentCategory === 'industry') {
        return "Bollywood, Tollywood, Kollywood, Mollywood... Which soil birthed this tale?";
      }
      const curiousLines = [
        "Hmm, the mist is parting! I sense something legendary in your thoughts...",
        "Interesting... That clue narrows down thousands of contenders!",
        "Let me consult the archives of 50,000+ Indian motion pictures...",
      ];
      return curiousLines[questionNumber % curiousLines.length];
    }

    // Default 'thinking' early questions
    if (questionNumber <= 2) {
      return "Focus your mind on the film... Picture the hero, the music, the theatre!";
    }
    if (questionNumber <= 4) {
      return "Is this a golden era classic or a 21st-century box-office monster?";
    }
    return "The reels are spinning in my crystal lamp... Answer truthfully!";
  }, [state, confidence, questionNumber, currentCategory, customDialogue]);

  return (
    <div className="relative flex flex-col items-center justify-center my-3 w-full max-w-lg mx-auto">
      {/* Dynamic Ambient Aura behind character */}
      <div
        className={`absolute top-10 w-44 h-44 rounded-full transition-all duration-1000 blur-3xl pointer-events-none ${
          state === 'celebration'
            ? 'bg-emerald-400/40 scale-125'
            : state === 'confident'
            ? 'bg-rose-500/40 scale-125'
            : state === 'curious'
            ? 'bg-amber-400/35 scale-110'
            : state === 'stumped'
            ? 'bg-purple-600/40 scale-125'
            : 'bg-blue-500/25 scale-100'
        }`}
      />

      {/* Comic Speech Bubble with CineGenie's witty dialogue */}
      <div className="relative z-20 mb-3 px-4 py-2.5 max-w-md w-full mx-auto">
        <div className="glass-panel-glow rounded-2xl px-4 py-2.5 shadow-xl border border-amber-500/30 text-center relative transform transition-all duration-300 hover:scale-[1.01]">
          {/* Glowing Speech pointer tail pointing down to CineGenie */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#101526] border-r border-b border-amber-500/40 transform rotate-45" />

          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1 font-jakarta">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>CineGenie Speaks</span>
          </div>

          <p className="text-xs md:text-sm text-slate-100 font-medium italic leading-snug drop-shadow">
            "{dialogue}"
          </p>
        </div>
      </div>

      {/* CineGenie Animated SVG Character */}
      <div className="relative z-10 w-40 h-40 md:w-48 md:h-48 animate-levitate transition-transform duration-700">
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full drop-shadow-[0_16px_25px_rgba(0,0,0,0.8)] filter"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="genieSkin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="40%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="turbanSilk" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <linearGradient id="rubyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            <linearGradient id="vestVelvet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            <linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            <linearGradient id="lampGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            <linearGradient id="smokeGlow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.95" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Golden Magic Lamp at Bottom */}
          <g transform="translate(145, 175) scale(0.48)">
            {/* Lamp base */}
            <ellipse cx="60" cy="85" rx="30" ry="8" fill="url(#lampGold)" stroke="#78350f" strokeWidth="2" />
            {/* Lamp belly */}
            <path
              d="M 30 85 C 20 65 30 40 60 40 C 90 40 100 65 90 85 Z"
              fill="url(#lampGold)"
              stroke="#78350f"
              strokeWidth="2"
            />
            {/* Lamp spout extending left towards genie */}
            <path
              d="M 35 48 C 10 45 -10 30 -30 20 C -25 25 -5 45 25 60 Z"
              fill="url(#lampGold)"
              stroke="#78350f"
              strokeWidth="2"
            />
            {/* Lamp lid & jewel finial */}
            <ellipse cx="60" cy="38" rx="16" ry="6" fill="#fef08a" stroke="#a16207" strokeWidth="1.5" />
            <circle cx="60" cy="30" r="4" fill="url(#rubyGlow)" />
            {/* Lamp handle */}
            <path
              d="M 85 45 C 115 40 120 75 88 80"
              fill="none"
              stroke="url(#lampGold)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          {/* Animated Mystical Smoke billowing from Lamp spout to Genie Body */}
          <g className="opacity-90">
            {/* Smoke Swirl 1 */}
            <path
              d="M 130 185 C 110 195 90 180 85 195 C 80 210 115 220 125 205 C 135 190 145 180 130 185 Z"
              fill="url(#smokeGlow)"
              filter="url(#glowFilter)"
              className="animate-pulse-aura"
            />
            {/* Lower Misty Vortex Body */}
            <path
              d="M 120 155 C 95 165 80 185 95 200 C 110 215 140 195 135 180 C 130 165 145 160 120 155 Z"
              fill="url(#smokeGlow)"
              opacity="0.85"
            />
            {/* Additional magical vapour wisps */}
            <circle cx="105" cy="188" r="7" fill="#60a5fa" opacity="0.6" filter="url(#glowFilter)" />
            <circle cx="132" cy="198" r="5" fill="#93c5fd" opacity="0.5" />
          </g>

          {/* Genie Torso & Royal Velvet Waistcoat */}
          <g>
            <ellipse cx="120" cy="150" rx="42" ry="28" fill="#1e3a8a" />
            {/* Velvet Waistcoat / Sherwani Vest */}
            <path
              d="M 94 135 L 86 172 C 105 178 135 178 154 172 L 146 135 Z"
              fill="url(#vestVelvet)"
            />
            {/* Gold Embroidered Lapels */}
            <path d="M 96 134 L 92 170 L 105 170 L 112 138 Z" fill="url(#goldFiligree)" />
            <path d="M 144 134 L 148 170 L 135 170 L 128 138 Z" fill="url(#goldFiligree)" />
            {/* Royal Gold Ruby Medallion Chain */}
            <path
              d="M 104 138 Q 120 156 136 138"
              fill="none"
              stroke="url(#goldFiligree)"
              strokeWidth="2.5"
            />
            <circle cx="120" cy="152" r="7.5" fill="url(#rubyGlow)" stroke="#fef08a" strokeWidth="2" filter="url(#glowFilter)" />
            <circle cx="120" cy="152" r="3" fill="#ffffff" opacity="0.7" />
          </g>

          {/* Genie Head & Features */}
          <g>
            {/* Pointy Mythical Genie Ears */}
            <path d="M 76 96 C 58 84 60 112 78 108 Z" fill="#2563eb" />
            <path d="M 164 96 C 182 84 180 112 162 108 Z" fill="#2563eb" />
            {/* Gold Earring on Left Ear */}
            <circle cx="172" cy="106" r="5" fill="none" stroke="url(#goldFiligree)" strokeWidth="2.5" />

            {/* Genie Face Oval */}
            <circle cx="120" cy="102" r="44" fill="url(#genieSkin)" />

            {/* Indian Cinema Grand Pagri (Royal Silk Turban) */}
            <path
              d="M 72 85 C 72 40 168 40 168 85 C 155 60 85 60 72 85 Z"
              fill="url(#turbanSilk)"
              filter="url(#glowFilter)"
            />
            {/* Front Turban Swirl Folds */}
            <path
              d="M 74 76 C 92 48 148 48 166 76 C 150 64 90 64 74 76 Z"
              fill="#b45309"
            />
            <path
              d="M 78 70 C 95 44 145 44 162 70 C 146 58 94 58 78 70 Z"
              fill="url(#turbanSilk)"
            />
            {/* Kalgi / Royal Feather Plume */}
            <path
              d="M 120 54 Q 116 22 126 12 Q 125 34 120 54"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            {/* Ruby Brooch with Gold Setting (Pulses with divine magic) */}
            <ellipse
              cx="120"
              cy="58"
              rx="7"
              ry="9"
              fill="url(#rubyGlow)"
              stroke="url(#goldFiligree)"
              strokeWidth="2"
              filter="url(#glowFilter)"
            />
            <circle cx="118" cy="56" r="2.5" fill="#ffffff" opacity="0.8" />
          </g>

          {/* EXPRESSIONS BY MOOD STATE */}

          {/* 1. THINKING STATE */}
          {state === 'thinking' && (
            <g>
              {/* Pensive Brows */}
              <path d="M 96 88 Q 106 83 113 89" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M 127 89 Q 134 81 144 86" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              {/* Upward Gaze */}
              <circle cx="105" cy="95" r="4.5" fill="#0f172a" />
              <circle cx="135" cy="95" r="4.5" fill="#0f172a" />
              {/* Glowing Iris lights */}
              <circle cx="106" cy="93" r="2" fill="#ffffff" />
              <circle cx="136" cy="93" r="2" fill="#ffffff" />
              {/* Pensive pursed mouth */}
              <path d="M 112 122 Q 120 120 128 122" stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* 2. CURIOUS / SKEPTICAL STATE */}
          {state === 'curious' && (
            <g>
              {/* One Arched Filmy Eyebrow */}
              <path d="M 94 88 Q 105 82 114 86" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M 126 82 Q 135 73 146 82" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              {/* Focused piercing eyes */}
              <circle cx="104" cy="97" r="4.5" fill="#0f172a" />
              <circle cx="136" cy="97" r="4.5" fill="#0f172a" />
              <circle cx="105" cy="96" r="2" fill="#ffffff" />
              <circle cx="137" cy="96" r="2" fill="#ffffff" />
              {/* Witty Smirk */}
              <path d="M 110 120 Q 122 126 132 118" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* 3. SMUG / CONFIDENT STATE (Bollywood Hero with Golden Aviators!) */}
          {state === 'confident' && (
            <g>
              {/* Golden Aviator Sunglasses */}
              <path
                d="M 88 90 Q 104 88 116 93 L 115 106 Q 104 113 88 103 Z"
                fill="#09090b"
                stroke="url(#goldFiligree)"
                strokeWidth="2.2"
                filter="url(#glowFilter)"
              />
              <path
                d="M 124 93 Q 136 88 152 90 L 152 103 Q 136 113 125 106 Z"
                fill="#09090b"
                stroke="url(#goldFiligree)"
                strokeWidth="2.2"
                filter="url(#glowFilter)"
              />
              <line x1="116" y1="95" x2="124" y2="95" stroke="#f59e0b" strokeWidth="2.5" />
              {/* Sunglass lens glint reflection */}
              <line x1="94" y1="94" x2="102" y2="103" stroke="#fef08a" strokeWidth="1.8" opacity="0.8" />
              <line x1="130" y1="94" x2="138" y2="103" stroke="#fef08a" strokeWidth="1.8" opacity="0.8" />
              {/* Confident Bollywood Hero Grin */}
              <path d="M 108 120 Q 120 132 132 120" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* 4. CELEBRATION / TRIUMPHANT STATE */}
          {state === 'celebration' && (
            <g>
              {/* Happy Arched Brows */}
              <path d="M 96 90 Q 105 84 114 90" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M 126 90 Q 135 84 144 90" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              {/* Radiant Eyes */}
              <circle cx="105" cy="96" r="4.5" fill="#0f172a" />
              <circle cx="135" cy="96" r="4.5" fill="#0f172a" />
              <circle cx="106" cy="94" r="2.2" fill="#ffffff" />
              <circle cx="136" cy="94" r="2.2" fill="#ffffff" />
              {/* Grand Joyful Smile with Glistening Teeth */}
              <path d="M 104 117 Q 120 136 136 117 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2.2" />
              <path d="M 108 118 Q 120 126 132 118" fill="#ffffff" />
              {/* Golden Victory Sparkles around head */}
              <circle cx="68" cy="65" r="3.5" fill="#fef08a" filter="url(#glowFilter)" />
              <circle cx="172" cy="65" r="3.5" fill="#fef08a" filter="url(#glowFilter)" />
            </g>
          )}

          {/* 5. STUMPED / ASTOUNDED STATE */}
          {state === 'stumped' && (
            <g>
              {/* Shocked / Inverted Brows */}
              <path d="M 94 85 Q 104 90 113 88" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M 127 88 Q 136 90 146 85" stroke="#0f172a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              {/* Wide Staring Shocked Eyes */}
              <circle cx="104" cy="98" r="6" fill="#0f172a" />
              <circle cx="136" cy="98" r="6" fill="#0f172a" />
              <circle cx="105" cy="97" r="2.5" fill="#ffffff" />
              <circle cx="137" cy="97" r="2.5" fill="#ffffff" />
              {/* Astounded 'O' Mouth */}
              <ellipse cx="120" cy="122" rx="7" ry="10" fill="#0f172a" />
            </g>
          )}

          {/* Iconic Indian Cinema Masala Mustachio */}
          <path
            d="M 120 114 C 110 111 102 115 95 113 C 101 117 113 118 120 115 C 127 118 139 117 145 113 C 138 115 130 111 120 114 Z"
            fill="#0f172a"
          />
        </svg>
      </div>

      {/* Floating Status Badge Pill */}
      <div className="mt-1 text-xs font-bold tracking-wider uppercase px-4 py-1 rounded-full glass-panel border border-amber-500/40 text-amber-300 shadow-md">
        {state === 'confident'
          ? '🔥 CineGenie is Closing In!'
          : state === 'celebration'
          ? '👑 Deduced with Precision!'
          : state === 'stumped'
          ? '🤯 CineGenie is Stumped!'
          : state === 'curious'
          ? '✨ CineGenie Senses a Match...'
          : '🔮 CineGenie is Divining...'}
      </div>
    </div>
  );
}
