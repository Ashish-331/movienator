import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Play,
  RotateCcw,
  Award,
  Clapperboard,
  Layers,
  BookOpen,
  Volume2,
  VolumeX,
  Compass,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import GenieAvatar from './components/GenieAvatar';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResponseButtons from './components/ResponseButtons';
import GuessModal from './components/GuessModal';
import TeachModal from './components/TeachModal';
import TopCandidatesDrawer from './components/TopCandidatesDrawer';
import LibraryModal from './components/LibraryModal';
import CinematicBackground from './components/CinematicBackground';
import { soundEffects } from './utils/soundEffects';

export default function App() {
  const [gameState, setGameState] = useState('welcome'); // welcome | playing | victory | defeat
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [confidence, setConfidence] = useState(0.05);
  const [entropy, setEntropy] = useState(4.0);
  const [isGuessReady, setIsGuessReady] = useState(false);
  const [guessedMovie, setGuessedMovie] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [stats, setStats] = useState({ total_movies: 50000, total_questions: 200 });
  const [loading, setLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());

  // Fetch dataset stats on load
  useEffect(() => {
    fetch('/api/game/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.total_movies) {
          setStats(data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectFromLibrary = (movie) => {
    setSelectedPrompt(movie);
    setIsLibraryOpen(false);
    handleStartGame();
  };

  const handleStartGame = async () => {
    soundEffects.playWhoosh();
    setLoading(true);
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });
      const data = await res.json();
      setSessionId(data.session_id);
      setQuestion(data.question);
      setQuestionNumber(data.question_number);
      setConfidence(data.confidence);
      setEntropy(data.entropy);
      setPreviews([]);
      setIsGuessReady(false);
      setGuessedMovie(null);
      setHistoryCount(0);
      setGameState('playing');
      soundEffects.playChime();
    } catch (err) {
      console.error(err);
      alert('Could not connect to Movienator Backend. Make sure the API server is running on port 8000!');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answerValue) => {
    if (!sessionId || !question || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          answer: answerValue,
        }),
      });
      const data = await res.json();

      setConfidence(data.confidence);
      setEntropy(data.entropy);
      setQuestionNumber(data.question_number);
      setPreviews(data.top_candidates_preview || []);
      setHistoryCount((c) => c + 1);

      const candidateGuess =
        data.guessed_movie ||
        data.runner_up_movie ||
        (data.top_candidates_preview && data.top_candidates_preview.length > 0 ? data.top_candidates_preview[0] : null);

      if (data.is_guess_ready && candidateGuess) {
        setGuessedMovie(candidateGuess);
        setIsGuessReady(true);
      } else if (data.question_number > 20 && candidateGuess) {
        setGuessedMovie(candidateGuess);
        setIsGuessReady(true);
      } else if (data.next_question) {
        soundEffects.playChime();
        setQuestion(data.next_question);
      } else if (candidateGuess) {
        setGuessedMovie(candidateGuess);
        setIsGuessReady(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!sessionId || historyCount === 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/game/undo?session_id=${sessionId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setQuestion(data.question);
        setQuestionNumber(data.question_number);
        setConfidence(data.confidence);
        setEntropy(data.entropy);
        setPreviews(data.top_candidates_preview || []);
        setHistoryCount((c) => Math.max(0, c - 1));
        setIsGuessReady(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGuess = async () => {
    try {
      await fetch('/api/game/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_correct: true }),
      });
      setIsGuessReady(false);
      setGameState('victory');
    } catch (err) {
      console.error(err);
      setIsGuessReady(false);
      setGameState('victory');
    }
  };

  const handleRejectGuess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_correct: false }),
      });
      const data = await res.json();
      setIsGuessReady(false);

      if (data.status === 'defeat' || data.status === 'game_over' || data.needs_teaching) {
        setGameState('defeat');
      } else if (data.next_question) {
        soundEffects.playChime();
        setQuestion(data.next_question);
        if (data.confidence !== undefined) setConfidence(data.confidence);
        if (data.entropy !== undefined) setEntropy(data.entropy);
        if (data.top_candidates_preview) setPreviews(data.top_candidates_preview);
      } else {
        setGameState('defeat');
      }
    } catch (err) {
      console.error(err);
      setIsGuessReady(false);
      setGameState('defeat');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    soundEffects.playClick();
    setGameState('welcome');
    setSelectedPrompt(null);
    setGuessedMovie(null);
    setIsGuessReady(false);
  };

  // Famous marquee titles across all industries
  const marqueeFilms = [
    'Sholay',
    'Baahubali',
    'RRR',
    'Dangal',
    'KGF Chapter 2',
    'Vikram',
    'Drishyam',
    'Lagaan',
    'Kantara',
    'Dilwale Dulhania Le Jayenge',
    'Manichitrathazhu',
    'Lucifer',
    'Pushpa',
    'Ponniyin Selvan',
    'Devdas',
    'Gangs of Wasseypur',
    'Asuran',
    'Vikramarkudu',
    'PK',
    '3 Idiots',
    'Swades',
    'Nayakan',
    'Mayabazar',
    'Kaithi',
    'Kantara',
    'Chupke Chupke',
    'Mughal-E-Azam',
    'Kumbalangi Nights',
    'Super Deluxe',
    'Pather Panchali',
  ];

  return (
    <div className="relative min-h-screen bg-[#07080e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Background Canvas Particles & Ambient Glow Aura */}
      <CinematicBackground confidence={confidence} gameState={gameState} />

      {/* Main Top Header Bar */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={handleRestart}
          className="flex items-center gap-3 cursor-pointer group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] transition-all">
            <div className="w-full h-full bg-[#0a0d18] rounded-[14px] flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl md:text-2xl font-black tracking-wider text-white font-cinzel gold-text-glow">
                MOVIENATOR
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">
                PRO
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-amber-400/80 font-medium tracking-wide">
              The CineGenie of Indian Cinema
            </p>
          </div>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-900/80 border-slate-700 text-slate-500 hover:text-slate-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
            title={isMuted ? 'Unmute Audio (Synthesizer)' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Film Explorer Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsLibraryOpen(true);
            }}
            className="hidden sm:flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700/80 hover:border-amber-500/50 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>Film Explorer</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              50K+
            </span>
          </button>

          {/* Restart Game Button if in active game */}
          {gameState !== 'welcome' && (
            <button
              onClick={handleRestart}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Return to Main Screen"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Gameplay Screen Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-5xl w-full mx-auto">
        {/* ================= WELCOME SCREEN ================= */}
        {gameState === 'welcome' && (
          <div className="w-full max-w-xl flex flex-col items-center text-center space-y-5 animate-fadeIn py-4">
            {/* CineGenie Hero Avatar */}
            <GenieAvatar
              mood="dynamic"
              confidence={0.1}
              questionNumber={1}
              customDialogue="Welcome, cinema lover! Think of ANY Indian movie—Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood or Regional... I shall read your mind!"
            />

            {/* Title & Tagline */}
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight font-cinzel gold-text-glow leading-tight">
                Think of Any Indian Movie.
              </h2>
              <p className="text-sm md:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
                Answer a few quick questions. Watch the CineGenie divine your secret film using Bayesian probability!
              </p>
            </div>

            {/* Rolling Cinema Marquee Ticker */}
            <div className="w-full overflow-hidden py-2 relative rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
              <div className="animate-marquee whitespace-nowrap text-xs font-semibold text-slate-400 flex items-center gap-4">
                {marqueeFilms.concat(marqueeFilms).map((film, idx) => (
                  <span key={idx} className="flex items-center gap-3">
                    <span className="hover:text-amber-400 transition-colors">{film}</span>
                    <span className="text-amber-500/50">•</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3 w-full text-xs text-slate-300 text-left">
              <div className="p-3.5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">50,000+ Film Archive</h4>
                  <p className="text-[11px] text-slate-400">Hindi, Telugu, Tamil, Malayalam, Kannada & more</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Bayesian AI Mind</h4>
                  <p className="text-[11px] text-slate-400">Entropy-based active question optimization</p>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={handleStartGame}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl font-black text-lg text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all transform active:scale-95 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Play className="w-5 h-5 fill-black group-hover:scale-110 transition-transform" />
                <span>{loading ? 'Awakening CineGenie...' : 'Play Now'}</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsLibraryOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Pick a Secret Movie from Catalog (50,000+ Films)</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= ACTIVE PLAYING SCREEN ================= */}
        {gameState === 'playing' && (
          <div className="w-full max-w-xl flex flex-col items-center animate-fadeIn py-2">
            {/* Secret Target Movie Reminder Pill (if chosen from library) */}
            {selectedPrompt && (
              <div className="mb-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 shadow-sm">
                <span>
                  Secret Target: <strong>{selectedPrompt.title}</strong> ({selectedPrompt.year})
                </span>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-slate-400 hover:text-white ml-1 font-bold text-xs cursor-pointer"
                  title="Dismiss Reminder"
                >
                  ✕
                </button>
              </div>
            )}

            {/* CineGenie Character with context speech bubble */}
            <GenieAvatar
              mood="dynamic"
              confidence={confidence}
              questionNumber={questionNumber}
              currentCategory={question?.category}
            />

            {/* Bayesian Progress Tracker */}
            <ProgressBar
              currentStep={questionNumber}
              maxSteps={25}
              confidence={confidence}
              entropy={entropy}
            />

            {/* Current Question Card */}
            <QuestionCard question={question} questionNumber={questionNumber} />

            {/* 5-Point Response Controls */}
            <ResponseButtons
              onAnswer={handleAnswer}
              onUndo={handleUndo}
              canUndo={historyCount > 0}
              disabled={loading}
              historyCount={historyCount}
            />

            {/* Live Bayesian Candidates Matrix */}
            <TopCandidatesDrawer previews={previews} entropy={entropy} />
          </div>
        )}

        {/* ================= VICTORY SCREEN ================= */}
        {gameState === 'victory' && (
          <div className="max-w-md w-full text-center space-y-6 animate-fadeIn py-6">
            <GenieAvatar mood="celebration" confidence={1.0} />

            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>CineGenie Triumph!</span>
              </span>

              <h2 className="text-3xl md:text-4xl font-black text-white font-cinzel gold-text-glow">
                The CineGenie Reads Your Mind!
              </h2>

              <p className="text-sm text-slate-300">
                I deduced <strong className="text-amber-400">{guessedMovie?.title}</strong> in{' '}
                <strong className="text-white">{questionNumber - 1}</strong> questions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleStartGame}
                className="w-full py-4 px-6 rounded-2xl font-black text-lg text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] transform active:scale-95 cursor-pointer"
              >
                Play Another Movie
              </button>

              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsLibraryOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer"
              >
                Browse Catalog & Challenge Again
              </button>
            </div>
          </div>
        )}

        {/* Modal: Guess Reveal */}
        {isGuessReady && guessedMovie && (
          <GuessModal
            movie={guessedMovie}
            confidence={confidence}
            onConfirm={handleConfirmGuess}
            onReject={handleRejectGuess}
          />
        )}

        {/* Modal: Crowdsourced Teach on Defeat */}
        {gameState === 'defeat' && (
          <TeachModal
            sessionId={sessionId}
            guessedMovie={guessedMovie}
            onComplete={() => setGameState('welcome')}
          />
        )}

        {/* Modal: 50,000+ Film Library Explorer */}
        <LibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectMovie={handleSelectFromLibrary}
        />
      </main>

      {/* Cinematic Theater Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Movienator Engine • Bayesian Active Learning with Shannon Entropy</p>
        <p className="flex items-center gap-1.5 text-slate-400">
          <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
          <span>Bollywood • Tollywood • Kollywood • Mollywood • Sandalwood • Regional</span>
        </p>
      </footer>
    </div>
  );
}
