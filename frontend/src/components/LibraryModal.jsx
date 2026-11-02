import React, { useState, useEffect } from 'react';
import { Search, X, Film, Clapperboard, User, Play, Sparkles } from 'lucide-react';

export default function LibraryModal({ isOpen, onClose, onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/movies/all')
        .then((res) => res.json())
        .then((data) => {
          setMovies(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const industries = ['All', 'Bollywood (Hindi)', 'Tollywood (Telugu)', 'Kollywood (Tamil)', 'Mollywood (Malayalam)', 'Sandalwood (Kannada)', 'Regional'];

  const filtered = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.director.toLowerCase().includes(search.toLowerCase()) ||
      m.lead_cast.some((c) => c.toLowerCase().includes(search.toLowerCase()));

    const matchesIndustry =
      industryFilter === 'All'
        ? true
        : industryFilter === 'Regional'
        ? m.industry.includes('Marathi') || m.industry.includes('Bengali')
        : m.industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-4xl w-full h-[88vh] rounded-2xl flex flex-col border border-slate-700/80 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl md:text-2xl font-black text-slate-100 font-cinzel">
                Indian Cinema Catalog
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                {movies.length} Films
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Browse the films currently in the CineGenie's knowledge matrix.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-100 transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, director (e.g. Rajamouli), or actor (e.g. Shah Rukh Khan, Kamal Haasan, Yash)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Industry Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustryFilter(ind)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                  industryFilter === ind
                    ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Movie Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading CineGenie library...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2">
              <Film className="w-8 h-8 text-slate-600" />
              <p>No films found matching "{search}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all flex gap-3 group relative overflow-hidden"
                >
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="w-16 h-24 object-cover rounded-lg shrink-0 border border-slate-800 shadow"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-24 bg-slate-800 rounded-lg shrink-0 flex items-center justify-center text-slate-600 text-xs font-cinzel">
                      🎬
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 truncate max-w-[140px]">
                          {m.industry.replace(' Cinema', '')}
                        </span>
                        <span className="text-[11px] font-mono text-amber-500 font-semibold">{m.year}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm mt-1 truncate group-hover:text-amber-400 transition-colors">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Clapperboard className="w-3 h-3 text-slate-500 shrink-0" />
                        {m.director}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-600 shrink-0" />
                        {m.lead_cast.slice(0, 2).join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectMovie(m)}
                      className="mt-2 text-xs py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-semibold border border-amber-500/30 flex items-center justify-center gap-1 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Think of this
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
