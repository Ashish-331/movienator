import React, { useState, useEffect } from 'react';
import { BrainCircuit, Send, Sparkles, Film, CheckCircle2, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects';

export default function TeachModal({ sessionId, guessedMovie, onComplete }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2023');
  const [industry, setIndustry] = useState('Bollywood (Hindi)');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [learned, setLearned] = useState(false);

  useEffect(() => {
    soundEffects.playDefeat();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEffects.playClick();
    setSubmitting(true);
    try {
      const resp = await fetch('/api/game/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          movie_title: title.trim(),
          year: parseInt(year) || 2023,
          industry: industry,
          director: director.trim() || 'Unknown',
          lead_cast: cast
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          distinguishing_question: question.trim(),
        }),
      });

      if (resp.ok) {
        soundEffects.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f59e0b'],
        });
        setLearned(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const industries = [
    'Bollywood (Hindi)',
    'Tollywood (Telugu)',
    'Kollywood (Tamil)',
    'Mollywood (Malayalam)',
    'Sandalwood (Kannada)',
    'Pollywood (Punjabi)',
    'Tollywood (Bengali)',
    'Marathi Cinema',
    'Gujarati Cinema',
    'Other Regional Cinema',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel-glow max-w-lg w-full rounded-3xl p-6 md:p-8 border border-purple-500/40 shadow-[0_0_80px_rgba(168,85,247,0.3)] relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 mb-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>Bayesian Reinforcement Learning</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white font-cinzel tracking-tight">
            You Stumped the CineGenie!
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            My crystal archives did not foresee this film. Teach me its identity and forever enrich my knowledge!
          </p>
        </div>

        {learned ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-cinzel">Knowledge Assimilated!</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-sm mx-auto">
                Thank you! The CineGenie has updated its Bayesian priors and will now recognize{' '}
                <strong className="text-amber-400">{title}</strong> in future games.
              </p>
            </div>

            <button
              onClick={() => {
                soundEffects.playWhoosh();
                onComplete();
              }}
              className="mt-4 w-full py-4 rounded-2xl font-bold text-base text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95"
            >
              Play Another Game
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Secret Movie Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kaithi, Vikramarkudu, Drishyam, Super Deluxe..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm shadow-inner transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Release Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Industry / Language
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Director & Lead Actors
              </label>
              <input
                type="text"
                placeholder="e.g. Lokesh Kanagaraj, Karthi, Narain"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            {guessedMovie && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-700/50 text-xs">
                <span className="font-bold text-purple-300 block mb-1">
                  Distinguishing Clue / Question (Recommended):
                </span>
                <p className="text-slate-300 mb-2">
                  What question would answer <span className="text-emerald-400 font-bold">YES</span> for your movie, but{' '}
                  <span className="text-rose-400 font-bold">NO</span> for {guessedMovie.title}?
                </p>
                <input
                  type="text"
                  placeholder="e.g. Does the story take place entirely over a single night?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-800/80 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 text-xs"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="w-full py-4 mt-3 rounded-2xl font-bold text-base text-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 hover:opacity-95 flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-black" />
              <span>{submitting ? 'Assimilating Movie...' : 'Teach CineGenie'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
