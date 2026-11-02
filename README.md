# 🎬 Movienator: The Akinator for Indian Cinema

> An intelligent, probabilistic 20-questions deduction engine and AAA cinematic web experience dedicated to Indian Cinema — spanning **50,625 films** across 19 regional industries (Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Bengali, Marathi, Punjabi, Gujarati, Urdu, Odia, Bhojpuri, and more). Think of any Indian film ever made, answer questions on a 5-point fuzzy scale, and the CineGenie will deduce it!

---

## ⚡ One-Click Launch

```bash
cd /home/ashish/movienator

# 1. Launch Unified Web App (Frontend + Backend on http://localhost:8000)
./run.sh

# 2. Or run developer mode with Hot Reloading (FastAPI on :8000 + Vite on :5173)
./run.sh --dev

# 3. Or play directly in your terminal
./run.sh --cli
```

Open **`http://localhost:8000`** in your browser to play immediately!

---

## 🌟 Key Features

* **🌌 Cinematic Atmosphere & Dynamic Aura**:
  * Floating HTML5 Canvas golden dust particles and starfield.
  * Real-time ambient aura that shifts color as the CineGenie closes in on the film:
    * *Mystic Indigo/Sapphire* (<35% confidence)
    * *Warm Golden Amber* (35–70% confidence)
    * *Fiery Crimson* (>70% confidence)
    * *Radiant Emerald* on Victory!
* **🧞‍♂️ The CineGenie Animated Character**:
  * Levitating SVG character with smooth physics and billowing magic lamp smoke.
  * Royal Indian Pagri turban with Kalgi plume and pulsating ruby brooch.
  * 5 expressive facial animations: *Thinking*, *Curious/Skeptical*, *Smug/Confident (golden aviator sunglasses)*, *Astounded/Stumped*, and *Celebration*.
  * Context-aware witty cinema dialogue speech bubbles.
* **🎵 Native Web Audio Synthesizer**:
  * Procedurally synthesized sound effects with zero external audio assets: mystical question chimes, tactile clicks, transition whooshes, victory fanfare, and defeat sounds.
  * Persistent Mute/Unmute toggle.
* **⚡ 50,625-Movie Vectorized Bayesian Engine**:
  * Ingested all 50,600+ records from `archive.zip` + curated iconic Indian films.
  * Indexed in SQLite (`backend/data/movies_50k.db`) and NumPy compressed attribute matrix (`backend/data/attributes_matrix.npz`).
  * 90 calibrated questions covering languages, eras, runtime, IMDb ratings, genres, and signature Indian tropes.
  * Vectorized Log-Likelihood and Mutual Information Gain in NumPy delivering **~3.4ms turn latency** across 50,000+ candidates!
* **🎯 5-Point Fuzzy Response Scale**:
  * `[1] / [Y]` — **Yes** ($s = 1.0$)
  * `[2] / [P]` — **Probably / Partially** ($s = 0.75$)
  * `[3] / [D]` — **Don't Know / Irrelevant** ($s = 0.50$ — zero penalty)
  * `[4]` — **Probably Not** ($s = 0.25$)
  * `[5] / [N]` — **No** ($s = 0.0$)
* **⏪ Time-Machine Undo**: Press `[Z]` or click Undo at any point to roll back an accidental misclick.
* **📚 50,000+ Film Explorer Modal**:
  * Fast debounced search across all 50,625 titles, directors, and star cast.
  * Filter pills for 13 industries and 5 film eras (Golden Era, 80s & 90s, Millennium, Modern).
  * Server-side paginated grid (24 films/page) ensuring 60fps buttery-smooth browsing.
  * "Think of this Movie" button to launch any film directly into the game.
* **🏆 Guess Reveal & Crowdsourced Learning**:
  * Spotlight reveal, certainty percentage badge, poster fallback, and confetti celebration.
  * Crowdsourced teaching modal to ingest un-guessed films and distinguishing clues.

---

## 📊 Benchmark & Performance Audit

Movienator includes an automated simulation test harness (`scripts/simulate_game_50k.py`) benchmarking Bayesian deduction against representative Indian films across eras and industries:

```bash
python3 scripts/simulate_game_50k.py
```

### Benchmark Results (50,625 Movies)
* **Total Movies Loaded**: **50,625** across 19 regional industries
* **Questions in Catalog**: **90**
* **Deduction Accuracy**: **100.0%** (35 / 35 successful deductions)
* **Robustness to Noise**: **100.0%** win rate under noisy/fuzzy human answers
* **Average Turn Latency**: **3.40 ms** (Target: < 15.0 ms — **4.4x faster!**)
* **P99 Turn Latency**: **8.71 ms**
* **Engine Startup Time**: **83.7 ms**

---

## 📁 Repository Structure

```
movienator/
├── run.sh                          <-- One-click unified launch script
├── requirements.txt                <-- Python backend dependencies
├── backend/                        <-- Production FastAPI Backend
│   ├── app.py                      <-- FastAPI server & static SPA mount
│   ├── engine_vectorized.py        <-- NumPy-vectorized Bayesian Active Learning engine
│   ├── engine.py                   <-- Core engine module
│   ├── models.py                   <-- Pydantic V2 validation schemas
│   ├── db.py                       <-- SQLite repository & in-memory cache manager
│   └── data/
│       ├── movies_50k.db           <-- Indexed SQLite DB with 50,625 films
│       ├── attributes_matrix.npz   <-- Compressed (50625, 90) attribute matrix
│       ├── questions_catalog.json  <-- 90 calibrated bisection questions
│       └── indian_cinema_50k_summary.json
├── frontend/                       <-- React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── App.jsx                 <-- Main game loop & orchestration
│   │   ├── utils/
│   │   │   └── soundEffects.js     <-- Web Audio API sound synthesizer
│   │   └── components/
│   │       ├── CinematicBackground.jsx <-- HTML5 Canvas particles & dynamic aura
│   │       ├── GenieAvatar.jsx     <-- Levitating SVG CineGenie with pagri & speech
│   │       ├── ProgressBar.jsx     <-- Confidence meter & entropy bits
│   │       ├── QuestionCard.jsx    <-- Question text with category badge
│   │       ├── ResponseButtons.jsx <-- Illuminated neon cards with key shortcuts
│   │       ├── GuessModal.jsx      <-- Spotlight deduction modal with confetti
│   │       ├── TeachModal.jsx      <-- Crowdsourced knowledge ingestion
│   │       ├── TopCandidatesDrawer.jsx <-- Live candidate odds matrix
│   │       └── LibraryModal.jsx    <-- 50,000+ film searchable catalog explorer
│   ├── dist/                       <-- Optimized production bundle
│   └── package.json
├── docs/                           <-- Complete Architectural Blueprint
│   ├── 01_ARCHITECTURE.md          <-- System design, C4 diagrams, Redis/Postgres
│   ├── 02_ALGORITHM_SPEC.md        <-- LogSumExp, Laplace smoothing, entropy proofs
│   ├── 03_DATA_PIPELINE.md         <-- TMDb, DuckDB IMDb streaming, SPARQL entity resolution
│   ├── 04_TAXONOMY_AND_ENRICHMENT.md <-- Indian cinema trope taxonomy and LLM tagging
│   └── 05_CROWDSOURCED_LEARNING.md <-- Matrix expansion & anti-vandalism gates
├── scripts/                        <-- Testing & Data Engineering
│   ├── simulate_game_50k.py        <-- 50,000+ movie simulation benchmark
│   └── generate_comprehensive_50k_dataset.py <-- Data cleaning & matrix generator
└── src/                            <-- Standalone CLI version
    ├── cli_game.py                 <-- Terminal Akinator
    ├── engine.py                   <-- Bayesian engine
    └── models.py                   <-- Dataclass models
```

---

## 🔌 REST API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Healthcheck (`movies_loaded: 50625`, `questions_loaded: 90`) |
| `/api/game/stats` | GET | 50,625 movie breakdown across 19 industries |
| `/api/movies/all` | GET | Paginated catalog (`page`, `limit`, `language`, `query`, `era_min`, `era_max`) |
| `/api/movies/search?q=` | GET | Fast indexed search by title, director, or star |
| `/api/game/start` | POST | Initialize a new session and receive optimal Q1 |
| `/api/game/answer` | POST | Submit 5-point answer, update probabilities, receive Q(t+1) |
| `/api/game/undo?session_id=` | POST | Roll back to previous turn snapshot |
| `/api/game/confirm` | POST | Confirm or reject CineGenie's guess |
| `/api/game/teach` | POST | Ingest new movie and distinguishing trope |

---

## 🕹️ How to Play

Open your browser to:
**[http://localhost:8000](http://localhost:8000)**

Or use the launcher script anytime:
```bash
cd /home/ashish/movienator
./run.sh         # Web App (single port 8000)
./run.sh --cli   # Terminal interactive game
```
