"""Movienator Bayesian and Entropy Decision Engine for Backend.
"""

import math
from typing import Dict, List, Optional, Tuple, Any
from .models import (
    Movie,
    Question,
    UserAnswer,
    GameSession,
    QuestionHistoryItem,
    QuestionModel,
    MovieModel,
)
from .engine_vectorized import VectorizedMovienatorEngine


class MovienatorEngine:
    def __init__(
        self,
        movies: Dict[str, Movie],
        questions: Dict[str, Question],
        confidence_threshold: float = 0.80,
        runner_up_ratio: float = 3.5,
        max_questions: int = 25,
        epsilon: float = 0.05,
    ):
        self.movies = movies
        self.questions = questions
        self.confidence_threshold = confidence_threshold
        self.runner_up_ratio = runner_up_ratio
        self.max_questions = max_questions
        self.epsilon = epsilon

    def create_session(self, session_id: str) -> GameSession:
        total_pop = sum(m.popularity for m in self.movies.values())
        if total_pop <= 0:
            total_pop = len(self.movies)
            priors = {m_id: 1.0 / total_pop for m_id in self.movies}
        else:
            priors = {m_id: m.popularity / total_pop for m_id, m in self.movies.items()}

        return GameSession(
            session_id=session_id,
            probabilities=priors,
            confidence_threshold=self.confidence_threshold,
            max_questions=self.max_questions,
        )

    def calculate_entropy(self, probabilities: Dict[str, float]) -> float:
        entropy = 0.0
        for p in probabilities.values():
            if p > 1e-9:
                entropy -= p * math.log2(p)
        return entropy

    def get_likelihood(self, movie_val: float, user_ans: UserAnswer) -> float:
        if user_ans == UserAnswer.DONT_KNOW:
            return 0.5
        user_val = user_ans.value_score
        diff = abs(movie_val - user_val)
        likelihood = (1.0 - diff) * (1.0 - 2 * self.epsilon) + self.epsilon
        return max(self.epsilon, min(1.0 - self.epsilon, likelihood))

    def select_next_question(self, session: GameSession) -> Optional[Question]:
        asked_ids = {h.question_id for h in session.history}
        available_questions = [q for q_id, q in self.questions.items() if q_id not in asked_ids]

        if not available_questions:
            return None

        best_question = None
        highest_score = -1.0

        for q in available_questions:
            p_yes = 0.0
            for m_id, prob in session.probabilities.items():
                movie = self.movies[m_id]
                val = movie.attributes.get(q.id, 0.5)
                p_yes += prob * val

            p_yes = max(1e-6, min(1.0 - 1e-6, p_yes))
            p_no = 1.0 - p_yes

            # Binary Entropy H(q)
            question_entropy = -(p_yes * math.log2(p_yes) + p_no * math.log2(p_no))
            score = question_entropy * q.weight

            if score > highest_score:
                highest_score = score
                best_question = q

        return best_question

    def submit_answer(
        self, session: GameSession, question: Question, answer: UserAnswer
    ) -> Tuple[Dict[str, float], bool]:
        new_probs = {}
        for m_id, prior in session.probabilities.items():
            movie = self.movies[m_id]
            movie_val = movie.attributes.get(question.id, 0.5)
            likelihood = self.get_likelihood(movie_val, answer)
            new_probs[m_id] = prior * likelihood

        total = sum(new_probs.values())
        if total > 0:
            for m_id in new_probs:
                new_probs[m_id] /= total
        else:
            new_probs = {m_id: 1.0 / len(new_probs) for m_id in new_probs}

        session.probabilities = new_probs
        session.step_count += 1
        session.probability_snapshots.append(dict(new_probs))

        top_after, top_prob = self.get_top_candidate(session)
        entropy_after = self.calculate_entropy(session.probabilities)

        session.history.append(
            QuestionHistoryItem(
                question_id=question.id,
                question_text=question.text,
                category=question.category,
                answer=answer,
                top_candidate=top_after,
                confidence=top_prob,
                entropy=entropy_after,
            )
        )

        is_ready = self.check_ready_to_guess(session)
        if is_ready:
            session.guessed_movie_id = top_after

        return session.probabilities, is_ready

    def undo_last_step(self, session: GameSession) -> Optional[QuestionModel]:
        """Reverts the last answer and restores previous probability distribution."""
        if not session.history or len(session.probability_snapshots) <= 1:
            return None
        session.history.pop()
        session.probability_snapshots.pop()
        session.probabilities = dict(session.probability_snapshots[-1])
        session.step_count = max(0, session.step_count - 1)
        session.guessed_movie_id = None
        next_q = self.select_next_question(session)
        if next_q:
            return QuestionModel(id=next_q.id, text=next_q.text, category=next_q.category, weight=next_q.weight)
        return None

    def check_ready_to_guess(self, session: GameSession) -> bool:
        top_m_id, top_prob = self.get_top_candidate(session)
        runner_up_m_id, runner_up_prob = self.get_runner_up_candidate(session)

        if top_prob >= session.confidence_threshold:
            return True

        if runner_up_prob > 0 and (top_prob / runner_up_prob) >= self.runner_up_ratio and top_prob >= 0.65:
            return True

        if session.step_count >= session.max_questions:
            return True

        return False

    def get_top_candidate(self, session: GameSession) -> Tuple[str, float]:
        if not session.probabilities:
            return "", 0.0
        sorted_cands = sorted(session.probabilities.items(), key=lambda x: x[1], reverse=True)
        return sorted_cands[0]

    def get_runner_up_candidate(self, session: GameSession) -> Tuple[str, float]:
        sorted_cands = sorted(session.probabilities.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_cands) > 1:
            return sorted_cands[1]
        return "", 0.0

    def eliminate_candidate_and_resume(self, session: GameSession, wrong_movie_id: str):
        session.probabilities[wrong_movie_id] = 0.0
        total = sum(session.probabilities.values())
        if total > 0:
            for m_id in session.probabilities:
                session.probabilities[m_id] /= total
        session.confidence_threshold = min(0.92, session.confidence_threshold + 0.05)
        session.max_questions += 5
        session.guessed_movie_id = None

    def get_top_candidates_preview(self, session: GameSession, limit: int = 5) -> List[Dict[str, Any]]:
        sorted_cands = sorted(session.probabilities.items(), key=lambda x: x[1], reverse=True)[:limit]
        previews = []
        for m_id, prob in sorted_cands:
            movie = self.movies.get(m_id)
            if movie:
                previews.append({
                    "id": movie.id,
                    "title": movie.title,
                    "year": movie.year,
                    "industry": movie.industry,
                    "probability": round(prob, 4),
                    "poster_url": movie.poster_url,
                })
        return previews
