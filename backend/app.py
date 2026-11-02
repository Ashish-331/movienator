"""FastAPI Web Application for Movienator.
"""

import uuid
import os
from pathlib import Path
from typing import Dict, Optional, List, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .models import (
    UserAnswer,
    QuestionModel,
    MovieModel,
    GameSession,
    StartGameResponse,
    AnswerRequest,
    AnswerResponse,
    ConfirmRequest,
    ConfirmResponse,
    TeachRequest,
    TeachResponse,
)
from .db import repo
from .engine_vectorized import VectorizedMovienatorEngine

app = FastAPI(title="Movienator API", version="2.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = VectorizedMovienatorEngine()
sessions: Dict[str, Any] = {}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "movies_loaded": len(repo.movies),
        "questions_loaded": len(repo.questions),
    }


@app.get("/api/game/stats")
def get_stats():
    return repo.get_stats()


@app.get("/api/movies/search")
def search_movies(q: str = "", limit: int = 20, language: Optional[str] = None):
    if not q:
        return []
    return repo.search_movies(q, limit=limit, language=language)


@app.get("/api/movies/all")
def get_all_movies(
    page: int = 1,
    limit: int = 24,
    language: Optional[str] = None,
    query: Optional[str] = None,
    era_min: Optional[int] = None,
    era_max: Optional[int] = None,
):
    """Returns movies in catalog with pagination and language/query/era filtering."""
    return repo.get_all_movies(
        page=page,
        limit=limit,
        language=language,
        query=query,
        era_min=era_min,
        era_max=era_max,
    )


@app.post("/api/game/start", response_model=StartGameResponse)
def start_game():
    session_id = str(uuid.uuid4())
    session = engine.create_session(session_id)
    sessions[session_id] = session

    first_q = engine.select_next_question(session)
    if not first_q:
        raise HTTPException(status_code=500, detail="No questions available in database.")

    entropy = engine.calculate_entropy(session.probabilities)
    _, top_prob = engine.get_top_candidate(session)

    return StartGameResponse(
        session_id=session_id,
        question_number=1,
        question=QuestionModel(
            id=first_q.id,
            text=first_q.text,
            category=first_q.category,
            weight=first_q.weight,
        ),
        entropy=round(entropy, 2),
        confidence=round(top_prob, 4),
        total_movies=len(repo.movies),
        total_questions=len(repo.questions),
    )


@app.post("/api/game/answer", response_model=AnswerResponse)
def submit_answer(req: AnswerRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    question = repo.questions.get(req.question_id)
    if not question:
        raise HTTPException(status_code=400, detail="Invalid question ID.")

    _, is_ready = engine.submit_answer(session, question, req.answer)

    # Force guess if at or beyond question 20
    if session.step_count >= 20 or session.step_count >= session.max_questions:
        is_ready = True

    entropy = engine.calculate_entropy(session.probabilities)
    top_m_id, top_prob = engine.get_top_candidate(session)
    runner_up_m_id, _ = engine.get_runner_up_candidate(session)
    previews = engine.get_top_candidates_preview(session, limit=4)

    def resolve_movie_model(m_id: str) -> Optional[MovieModel]:
        if not m_id:
            return None
        meta = engine.get_movie_metadata(m_id)
        if meta:
            return MovieModel(
                id=meta["id"],
                title=meta["title"],
                year=meta["year"],
                industry=meta["industry"],
                director=meta["director"],
                lead_cast=meta["lead_cast"],
                poster_url=meta.get("poster_url"),
                popularity=float(meta.get("popularity", 1.0)),
            )
        m = repo.get_movie(m_id)
        if m:
            return MovieModel(
                id=m.id,
                title=m.title,
                year=m.year,
                industry=m.industry,
                director=m.director,
                lead_cast=m.lead_cast,
                poster_url=m.poster_url,
                popularity=float(m.popularity),
            )
        return None

    guessed_movie_model = None
    runner_up_model = None
    next_q_model = None

    if is_ready:
        guessed_movie_model = resolve_movie_model(top_m_id)
        if not guessed_movie_model and previews:
            guessed_movie_model = resolve_movie_model(previews[0]["id"])
        if runner_up_m_id:
            runner_up_model = resolve_movie_model(runner_up_m_id)
    else:
        next_q = engine.select_next_question(session)
        if next_q:
            next_q_model = QuestionModel(
                id=next_q.id,
                text=next_q.text,
                category=next_q.category,
                weight=next_q.weight,
            )
        else:
            # Out of questions: trigger fallback guess immediately
            is_ready = True
            guessed_movie_model = resolve_movie_model(top_m_id)
            if not guessed_movie_model and previews:
                guessed_movie_model = resolve_movie_model(previews[0]["id"])

    return AnswerResponse(
        session_id=session.session_id,
        question_number=session.step_count + 1,
        is_guess_ready=is_ready,
        entropy=round(entropy, 2),
        confidence=round(top_prob, 4),
        next_question=next_q_model,
        guessed_movie=guessed_movie_model,
        runner_up_movie=runner_up_model,
        top_candidates_preview=previews,
    )


@app.post("/api/game/undo")
def undo_last_step(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    next_q = engine.undo_last_step(session)
    if not next_q:
        raise HTTPException(status_code=400, detail="Cannot undo initial state.")

    entropy = engine.calculate_entropy(session.probabilities)
    _, top_prob = engine.get_top_candidate(session)
    previews = engine.get_top_candidates_preview(session, limit=4)

    return {
        "status": "success",
        "question_number": session.step_count + 1,
        "question": next_q,
        "entropy": round(entropy, 2),
        "confidence": round(top_prob, 4),
        "top_candidates_preview": previews,
    }


@app.post("/api/game/confirm", response_model=ConfirmResponse)
def confirm_guess(req: ConfirmRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if req.is_correct:
        session.is_completed = True
        return ConfirmResponse(
            session_id=session.session_id,
            status="victory",
            message=f"Hooray! The CineGenie deduced your movie in {session.step_count} questions!",
            needs_teaching=False,
        )
    else:
        # User says incorrect!
        top_m_id, _ = engine.get_top_candidate(session)
        engine.eliminate_candidate_and_resume(session, top_m_id)

        # Check if more candidates exist or if attempt/question ceiling is reached
        top_new, prob_new = engine.get_top_candidate(session)
        if (
            not top_new
            or prob_new <= 0
            or session.step_count >= 20
            or session.step_count >= session.max_questions
            or getattr(session, "guess_attempts", 0) >= 2
        ):
            return ConfirmResponse(
                session_id=session.session_id,
                status="defeat",
                message="You stumped me! Please teach me what movie you were thinking of.",
                needs_teaching=True,
            )

        next_q = engine.select_next_question(session)
        if not next_q:
            return ConfirmResponse(
                session_id=session.session_id,
                status="defeat",
                message="I've run out of questions! Teach me your movie.",
                needs_teaching=True,
            )

        entropy_new = engine.calculate_entropy(session.probabilities)
        previews_new = engine.get_top_candidates_preview(session, limit=4)

        return ConfirmResponse(
            session_id=session.session_id,
            status="resumed",
            message="Eliminated wrong guess. Continuing search...",
            needs_teaching=False,
            next_question=QuestionModel(
                id=next_q.id,
                text=next_q.text,
                category=next_q.category,
                weight=next_q.weight,
            ),
            confidence=round(prob_new, 4),
            entropy=round(entropy_new, 2),
            top_candidates_preview=previews_new,
        )


@app.post("/api/game/teach", response_model=TeachResponse)
def teach_movie(req: TeachRequest):
    # 1. Ingest movie
    movie = repo.add_or_update_movie(
        title=req.movie_title,
        year=req.year,
        industry=req.industry,
        director=req.director,
        lead_cast=req.lead_cast,
    )

    # 2. Ingest distinguishing question if provided
    session = sessions.get(req.session_id)
    guess_movie_id = session.guessed_movie_id if session else None

    if req.distinguishing_question and req.distinguishing_question.strip():
        repo.add_distinguishing_question(
            question_text=req.distinguishing_question.strip(),
            target_movie_id=movie.id,
            guess_movie_id=guess_movie_id,
        )

    # 3. Synchronize engine
    engine.load()

    return TeachResponse(
        status="learned",
        message=f"Successfully learned '{movie.title}'! The CineGenie will now recognize it in future games.",
        movie_id=movie.id,
    )


# Static build mount for monolithic serving
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        target_file = dist_dir / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        index_file = dist_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index not found")

