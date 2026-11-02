import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  Clapperboard,
  User,
  Play,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Sparkles,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export default function LibraryModal({ isOpen, onClose, onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [totalCount, setTotalCount] = useState(50625);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedEra, setSelectedEra] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 24;

  const industries = [
    'All',
    'Hindi',
    'Telugu',
    'Tamil',
    'Malayalam',
    'Kannada',
    'Bengali',
    'Marathi',
    'Punjabi',
    'Gujarati',
    'Urdu',
    'Bhojpuri',
    'Odia',
  ];

  const eras = [
    { id: 'All', label: 'All Eras' },
    { id: 'golden', label: 'Golden Era (≤1979)', min: 0, max: 1979 },
    { id: 'classic', label: '80s & 90s (1980–1999)', min: 1980, max: 1999 },
    { id: 'millennium', label: '2000s Era (2000–2015)', min: 2000, max: 2015 },
    { id: 'modern', label: 'Modern (2016–Present)', min: 2016, max: 2099 },
  ];

  // Debounce search input for instant typing responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch movies from server dynamically across all 50,000+ films
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const activeEraObj = eras.find((e) => e.id === selectedEra);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', ITEMS_PER_PAGE.toString());

    if (selectedIndustry !== 'All') {
      params.set('language', selectedIndustry);
    }
    if (debouncedSearch) {
      params.set('query', debouncedSearch);
    }
    if (activeEraObj && activeEraObj.id !== 'All') {
      params.set('era_min', activeEraObj.min.toString());
      params.set('era_max', activeEraObj.max.toString());
    }

    fetch(`/api/movies/all?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.items) {
          setMovies(data.items);
          setTotalCount(data.total || 0);
          setTotalPages(data.total_pages || 1);
        } else if (Array.isArray(data)) {
          setMovies(data);
          setTotalCount(data.length);
          setTotalPages(Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching catalog:', err);
        setLoading(false);
      });
  }, [isOpen, page, debouncedSearch, selectedIndustry, selectedEra]);

  const handleIndustryChange = (ind) => {
    soundEffects.playClick();
    setSelectedIndustry(ind);
    setPage(1);
  };

  const handleEraChange = (eraId) => {
    soundEffects.playClick();
    setSelectedEra(eraId);
    setPage(1);
  };

  const handleSelect = (movie) => {
    soundEffects.playWhoosh();
    onSelectMovie(movie);
  };

  const handleClose = () => {
    soundEffects.playClick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="glass-panel-glow max-w-5xl w-full h-[92vh] rounded-3xl flex flex-col border border-amber-500/30 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <Film className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-black text-white font-cinzel">
                Indian Cinema Catalog Explorer
              </h2>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-mono">
                {movies.length > 0 ? `${movies.length.toLocaleString()} Films` : '50,000+ Films'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Browse through our comprehensive database spanning all Indian cinema industries and decades.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer active:scale-95"
            aria-label="Close Explorer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 space-y-3 shrink-0">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-amber-400/70" />
            <input
              type="text"
              placeholder="Search by title, director (e.g. Rajamouli, Mani Ratnam, Kashyap), or star (e.g. Shah Rukh, Mohanlal, Rajinikanth)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
            {/* Industry Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider shrink-0">
                <Filter className="w-3 h-3 text-amber-400" /> Industry:
              </span>
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => handleIndustryChange(ind)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedIndustry === ind
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>

            {/* Era Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider shrink-0">
                <Calendar className="w-3 h-3 text-amber-400" /> Era:
              </span>
              {eras.map((era) => (
                <button
                  key={era.id}
                  onClick={() => handleEraChange(era.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border cursor-pointer ${
                    selectedEra === era.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Movies Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-medium">Unlocking CineGenie's 50,000+ Master Archive...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 py-12">
              <Film className="w-12 h-12 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-300">No films matched your search</h3>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Try searching with a broader keyword, actor name, or select "All" in industry/era filters.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedIndustry('All');
                  setSelectedEra('All');
                  setPage(1);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {movies.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-200 flex gap-3.5 group relative overflow-hidden shadow-lg"
                >
                  {/* Poster Thumbnail or Cinema Placeholder */}
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      loading="lazy"
                      className="w-16 h-24 object-cover rounded-xl shrink-0 border border-slate-800 shadow-md group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 shrink-0 flex flex-col items-center justify-center border border-slate-700/80 shadow text-amber-400/80 group-hover:scale-105 transition-transform">
                      <Clapperboard className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-mono font-bold text-slate-400">{m.year}</span>
                    </div>
                  )}

                  {/* Movie Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 truncate max-w-[130px]">
                          {m.industry ? m.industry.replace(' Cinema', '') : 'Indian'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">{m.year}</span>
                      </div>

                      <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {m.title}
                      </h4>

                      {m.director && (
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Clapperboard className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Dir: {m.director}</span>
                        </p>
                      )}

                      {Array.isArray(m.lead_cast) && m.lead_cast.length > 0 && (
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{m.lead_cast.slice(0, 2).join(', ')}</span>
                        </p>
                      )}
                    </div>

                    {/* Action Button: "Think of this Movie" */}
                    <button
                      onClick={() => handleSelect(m)}
                      className="mt-2 text-xs py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Think of this Movie</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Pagination Footer */}
        {totalCount > 0 && (
          <div className="p-3.5 md:p-4 border-t border-slate-800/90 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{(page - 1) * ITEMS_PER_PAGE + 1}</strong> –{' '}
              <strong className="text-white">
                {Math.min(page * ITEMS_PER_PAGE, totalCount)}
              </strong>{' '}
              of <strong className="text-amber-400">{totalCount.toLocaleString()}</strong> films
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
