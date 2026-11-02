import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Play, RotateCcw, Award, Clapperboard, Layers, BookOpen } from 'lucide-react';
import GenieAvatar from './components/GenieAvatar';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import ResponseButtons from './components/ResponseButtons';
import GuessModal from './components/GuessModal';
import TeachModal from './components/TeachModal';
import TopCandidatesDrawer from './components/TopCandidatesDrawer';
import LibraryModal from './components/LibraryModal';

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
  const [stats, setStats] = useState({ total_movies: 0, total_questions: 0 });
  const [loading, setLoading] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // Fetch dataset stats on load
  useEffect(() => {
    fetch('/api/game/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSelectFromLibrary = (movie) => {
    setSelectedPrompt(movie);
    setIsLibraryOpen(false);
    handleStartGame();
  };

  const handleStartGame = async () => {
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

      if (data.is_guess_ready && data.guessed_movie) {
        setGuessedMovie(data.guessed_movie);
        setIsGuessReady(true);
      } else {
        setQuestion(data.next_question);
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
      const res = await fetch('/api/game/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_correct: true }),
      });
      const data = await res.json();
      setIsGuessReady(false);
      setGameState('victory');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectGuess = async () => {
    try {
      const res = await fetch('/api/game/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, is_correct: false }),
      });
      const data = await res.json();

      setIsGuessReady(false);
      if (data.needs_teaching) {
        setGameState('defeat');
      } else if (data.next_question) {
        setQuestion(data.next_question);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-3">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl font-cinzel">
            🎬
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-100 font-cinzel flex items-center gap-1.5">
              MOVIENATOR
              <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">The CineGenie of Indian Cinema</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Explore Library</span> ({stats.total_movies || 100})
          </button>

          {gameState === 'playing' && (
            <button
              onClick={() => setGameState('welcome')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center my-4 w-full">
        {gameState === 'welcome' && (
          <div className="max-w-md w-full text-center space-y-6 animate-fadeIn py-6">
            <GenieAvatar mood="thinking" confidence={0.1} />

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 font-cinzel">
                Think of an Indian Movie.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood... I will deduce what you have in mind in under 20 questions!
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 py-1">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bayesian Active Learning</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400 shrink-0" />
                <span>All Indian Industries</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all transform active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-black" />
              {loading ? 'Awakening CineGenie...' : 'Play Now'}
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="w-full max-w-xl flex flex-col items-center animate-fadeIn">
            {selectedPrompt && (
              <div className="mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <span>Secret Movie: <strong>{selectedPrompt.title}</strong> ({selectedPrompt.year})</span>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-slate-400 hover:text-slate-200 ml-1 font-bold text-[10px]"
                >
                  ✕
                </button>
              </div>
            )}
            <GenieAvatar mood="dynamic" confidence={confidence} />
            <ProgressBar
              currentStep={questionNumber}
              maxSteps={25}
              confidence={confidence}
              entropy={entropy}
            />
            <QuestionCard question={question} questionNumber={questionNumber} />
            <ResponseButtons
              onAnswer={handleAnswer}
              onUndo={handleUndo}
              canUndo={historyCount > 0}
              disabled={loading}
            />
            <TopCandidatesDrawer previews={previews} entropy={entropy} />
          </div>
        )}

        {gameState === 'victory' && (
          <div className="max-w-md w-full text-center space-y-6 animate-fadeIn py-8">
            <GenieAvatar mood="celebration" confidence={1.0} />
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Award className="w-4 h-4" /> Victory!
              </span>
              <h2 className="text-3xl font-black text-amber-400 font-cinzel">
                Another Victory for the CineGenie!
              </h2>
              <p className="text-sm text-slate-300">
                I guessed <strong className="text-slate-100">{guessedMovie?.title}</strong> in {questionNumber - 1} questions.
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] transform active:scale-95"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Guess Modal */}
        {isGuessReady && guessedMovie && (
          <GuessModal
            movie={guessedMovie}
            confidence={confidence}
            onConfirm={handleConfirmGuess}
            onReject={handleRejectGuess}
          />
        )}

        {/* Teach Modal */}
        {gameState === 'defeat' && (
          <TeachModal
            sessionId={sessionId}
            guessedMovie={guessedMovie}
            onComplete={() => setGameState('welcome')}
          />
        )}

        {/* Catalog / Library Modal */}
        <LibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectMovie={handleSelectFromLibrary}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto pt-4 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Movienator Engine • Powered by Bayesian Inference & Information Entropy</p>
      </footer>
    </div>
  );
}
