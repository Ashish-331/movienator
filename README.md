# 🎬 Movienator: The Akinator for Indian Cinema

> An intelligent, probabilistic 20-questions deduction engine and interactive web app dedicated to Indian Cinema — spanning Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Bengali, and Marathi cinema. Think of an Indian film, answer questions across a 5-point fuzzy scale, and the CineGenie will deduce it in under 20 questions!

---

## ⚡ One-Click Launch

Run the self-contained launcher:

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

* **🧞‍♂️ Animated CineGenie Avatar**: High-fidelity dynamic SVG avatar that reacts to game states:
  * *Thinking* at low confidence.
  * *Curious* at medium confidence.
  * *Confident* with golden sunglasses at high confidence.
  * *Celebration* with confetti on deduction victory.
  * *Stumped* when challenged or defeated.
* **🧠 Bayesian Active Learning**: Log-likelihood Bayesian updates with Laplace $\epsilon$-floor smoothing. Resilient to human error and misremembered trivia.
* **📉 Shannon Entropy & Information Gain**: Bisects probability mass with near 50/50 splits, achieving an average deduction in **~7.3 questions** (well below the 20-turn ceiling).
* **🎯 5-Point Fuzzy Response Scale**:
  * `[1] / [Y]` — **Yes** ($s = 1.0$)
  * `[2] / [P]` — **Probably / Partially** ($s = 0.75$)
  * `[3] / [D]` — **Don't Know / Neutral** ($s = 0.50$ — zero penalty)
  * `[4] / [PN]` — **Probably Not** ($s = 0.25$)
  * `[5] / [N]` — **No** ($s = 0.0$)
* **⏪ Time-Machine Undo**: Press `[Z]` or click Undo at any point to roll back an accidental misclick.
* **📊 Live Entropy & Probability Matrix**: Slide-out drawer displaying candidate probabilities and real-time entropy bits ($H$).
* **📚 Interactive 100-Movie Catalog Browser**: Filter by industry (*Bollywood, Tollywood, Kollywood, Mollywood, Sandalwood, Regional*), search by actor/director, and click *"Think of this"* to immediately challenge the CineGenie with any title.
* **🎓 Crowdsourced Self-Learning**: When stumped, the game prompts the user for the movie and an optional distinguishing question, dynamically expanding the knowledge base in real time.

---

## 📊 Benchmark & Performance Audit

Movienator includes an automated simulation test harness (`scripts/simulate_game.py`) that benchmarks Bayesian deduction against diverse Indian films across all industries:

```bash
python3 scripts/simulate_game.py
```

### Benchmark Results
* **Accuracy Rate**: **100.0%** (35 / 35 successful deductions across all 7 industries)
* **Average Questions to Win**: **7.29 turns** (Well below the 20-question limit)
* **Average Turn Latency**: **0.445 ms** (Instantaneous active learning bisection)
* **Dataset Size**: **100 Iconic Films**, **53 Calibrated Tropes**

---

## 📁 Repository Structure

```
movienator/
├── run.sh                          <-- One-click unified launch script
├── requirements.txt                <-- Python backend dependencies
├── backend/                        <-- Production FastAPI Backend
│   ├── app.py                      <-- FastAPI server & static SPA mount
│   ├── engine.py                   <-- Bayesian inference & entropy calculation
│   ├── models.py                   <-- Pydantic V2 validation schemas
│   ├── db.py                       <-- In-memory data manager & JSON persistence
│   └── data/
│       └── indian_cinema.json      <-- 100 films & 53 calibrated tropes
├── frontend/                       <-- React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── App.jsx                 <-- Main game loop & orchestration
│   │   └── components/
│   │       ├── GenieAvatar.jsx     <-- Dynamic reactive SVG CineGenie
│   │       ├── ProgressBar.jsx     <-- Confidence meter & entropy bits
│   │       ├── QuestionCard.jsx    <-- Question text with category pill
│   │       ├── ResponseButtons.jsx <-- 5-point scale with keyboard shortcuts
│   │       ├── GuessModal.jsx      <-- Deduction modal with confetti
│   │       ├── TeachModal.jsx      <-- Crowdsourced knowledge ingestion
│   │       ├── TopCandidatesDrawer.jsx <-- Live candidate odds matrix
│   │       └── LibraryModal.jsx    <-- 100-film searchable catalog browser
│   ├── dist/                       <-- Production optimized production bundle
│   └── package.json
├── docs/                           <-- Complete Architectural Blueprint
│   ├── 01_ARCHITECTURE.md          <-- System design, C4 diagrams, Redis/Postgres
│   ├── 02_ALGORITHM_SPEC.md        <-- LogSumExp, Laplace smoothing, entropy proofs
│   ├── 03_DATA_PIPELINE.md         <-- TMDb, IMDb TSV DuckDB ETL, Wikidata SPARQL
│   ├── 04_TAXONOMY_AND_ENRICHMENT.md <-- 160-question Indian cinema trope taxonomy
│   └── 05_CROWDSOURCED_LEARNING.md <-- Matrix expansion & anti-vandalism gates
├── scripts/                        <-- Testing & Data Engineering
│   ├── simulate_game.py            <-- Automated simulation benchmark
│   └── generate_comprehensive_dataset.py <-- 100-film catalog generator
└── src/                            <-- Standalone CLI version
    ├── cli_game.py                 <-- Terminal Akinator
    ├── engine.py                   <-- Standalone Bayesian engine
    └── models.py                   <-- Dataclass models
```

---

## 🔌 REST API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Healthcheck and active movie/question count |
| `/api/game/stats` | GET | Total movie count and breakdown by film industry |
| `/api/movies/all` | GET | Full catalog sorted by popularity for the library browser |
| `/api/movies/search?q=` | GET | Search catalog by title, director, or actor |
| `/api/game/start` | POST | Initialize a new session and receive optimal Q1 |
| `/api/game/answer` | POST | Submit 5-point answer, update probabilities, receive Q(t+1) |
| `/api/game/undo?session_id=` | POST | Roll back to previous turn snapshot |
| `/api/game/confirm` | POST | Confirm or reject CineGenie's guess |
| `/api/game/teach` | POST | Ingest new movie and distinguishing trope |

---

## 🧠 Algorithmic Foundation

### Bayesian Inference with Laplace $\epsilon$-Floor Smoothing
$$P(C_i \mid D_t) = \frac{P(a_{(t)} \mid C_i, Q_{(t)}) \cdot P(C_i \mid D_{t-1})}{\sum_{k=1}^N P(a_{(t)} \mid C_k, Q_{(t)}) \cdot P(C_k \mid D_{t-1})}$$

### Expected Information Gain ($50/50$ Bisection)
$$E[IG(Q)] = H(A_Q \mid D_t) - \sum_{i=1}^N P(C_i \mid D_t) H(A_Q \mid C_i)$$

Questions partition the candidate probability mass into equal halves, achieving logarithmic search complexity $\mathcal{O}(\log N)$.

---

## 📜 Complete Blueprint Documentation

* [01_ARCHITECTURE.md](file:///home/ashish/movienator/docs/01_ARCHITECTURE.md): Microservices, C4 diagrams, Redis session caching, PostgreSQL schema.
* [02_ALGORITHM_SPEC.md](file:///home/ashish/movienator/docs/02_ALGORITHM_SPEC.md): Mathematical formulations, LogSumExp numerical stability, Bayesian rebound proof.
* [03_DATA_PIPELINE.md](file:///home/ashish/movienator/docs/03_DATA_PIPELINE.md): TMDb, DuckDB IMDb streaming, SPARQL entity resolution.
* [04_TAXONOMY_AND_ENRICHMENT.md](file:///home/ashish/movienator/docs/04_TAXONOMY_AND_ENRICHMENT.md): 160-question Indian cinema trope taxonomy and LLM tagging pipeline.
* [05_CROWDSOURCED_LEARNING.md](file:///home/ashish/movienator/docs/05_CROWDSOURCED_LEARNING.md): Defeat workflow, Dirichlet conjugate updates, and anti-vandalism gating.
