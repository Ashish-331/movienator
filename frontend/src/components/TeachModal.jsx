import React, { useState } from 'react';
import { BrainCircuit, Send, Sparkles, Film } from 'lucide-react';

export default function TeachModal({ sessionId, guessedMovie, onComplete }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('2022');
  const [industry, setIndustry] = useState('Bollywood (Hindi)');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [learned, setLearned] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const resp = await fetch('/api/game/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          movie_title: title.trim(),
          year: parseInt(year) || 2022,
          industry: industry,
          director: director.trim() || 'Unknown',
          lead_cast: cast.split(',').map((s) => s.trim()).filter(Boolean),
          distinguishing_question: question.trim(),
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setLearned(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-card max-w-lg w-full rounded-2xl p-6 md:p-8 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-500/20 text-purple-400 border border-purple-500/40 mb-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Crowdsourced Learning
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-cinzel">
            You Stumped the CineGenie!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Teach me what movie you were thinking of so I'll guess it next time!
          </p>
        </div>

        {learned ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 font-cinzel">Knowledge Assimilated!</h3>
            <p className="text-sm text-slate-400 mt-2">
              Thank you! The CineGenie has updated its Bayesian priors and will now recognize <strong className="text-amber-400">{title}</strong>.
            </p>
            <button
              onClick={onComplete}
              className="mt-6 w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 transition-all shadow-lg"
            >
              Play Another Game
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Movie Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vikramarkudu, Kaithi, Swades"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Release Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Industry / Language
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Bollywood (Hindi)">Bollywood (Hindi)</option>
                  <option value="Tollywood (Telugu)">Tollywood (Telugu)</option>
                  <option value="Kollywood (Tamil)">Kollywood (Tamil)</option>
                  <option value="Mollywood (Malayalam)">Mollywood (Malayalam)</option>
                  <option value="Sandalwood (Kannada)">Sandalwood (Kannada)</option>
                  <option value="Other Regional Cinema">Other Regional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Director & Lead Actors
              </label>
              <input
                type="text"
                placeholder="Director name, Actor 1, Actor 2"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {guessedMovie && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs">
                <span className="font-semibold text-purple-300 block mb-1">
                  Distinguishing Question (Optional):
                </span>
                <p className="text-slate-400 mb-2">
                  What question would be <span className="text-emerald-400 font-bold">YES</span> for your movie, but <span className="text-rose-400 font-bold">NO</span> for {guessedMovie.title}?
                </p>
                <input
                  type="text"
                  placeholder="e.g. Does the hero possess a magical stone?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-black" />
              {submitting ? 'Teaching CineGenie...' : 'Submit & Teach CineGenie'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
