"""Movienator Core Decision Engine.
Implements Bayesian inference, Shannon entropy-based question selection,
and 5-point fuzzy response scaling.
"""

import math
from typing import Dict, List, Optional, Tuple
from .models import Movie, Question, UserAnswer, GameSession, QuestionHistory


class MovienatorEngine:
    def __init__(
        self,
        movies: List[Movie],
        questions: List[Question],
        confidence_threshold: float = 0.82,
        runner_up_ratio: float = 3.5,
        max_questions: int = 25,
        epsilon: float = 0.05,
    ):
        """
        Initialize the Movienator engine.
        :param movies: List of all candidate movies.
        :param questions: Master pool of questions.
        :param confidence_threshold: Probability threshold at which to guess.
        :param runner_up_ratio: If top_candidate / runner_up > ratio, also triggers a guess.
        :param max_questions: Hard cutoff for questioning.
        :param epsilon: Minimum likelihood floor to prevent zero-probability lockouts.
        """
        self.movies: Dict[str, Movie] = {m.id: m for m in movies}
        self.questions: Dict[str, Question] = {q.id: q for q in questions}
        self.confidence_threshold = confidence_threshold
        self.runner_up_ratio = runner_up_ratio
        self.max_questions = max_questions
        self.epsilon = epsilon

    def start_session(self, session_id: str = "default_session") -> GameSession:
        """Initializes a new game session with popularity-weighted prior probabilities."""
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
        """Calculates Shannon Entropy: H(S) = - sum(p_i * log2(p_i))."""
        entropy = 0.0
        for p in probabilities.values():
            if p > 1e-9:
                entropy -= p * math.log2(p)
        return entropy

    def get_likelihood(self, movie_val: float, user_ans: UserAnswer) -> float:
        """
        Calculates Likelihood P(Answer | Movie, Question).
        movie_val: 1.0 (True), 0.0 (False), or 0.5 (Unknown/Neutral)
        user_ans: YES, PROBABLY, DONT_KNOW, PROBABLY_NOT, NO
        Uses Laplace smoothing so likelihood never equals zero.
        """
        user_val = user_ans.value_score

        # If user doesn't know, it provides zero discriminator info: uniform likelihood
        if user_ans == UserAnswer.DONT_KNOW:
            return 0.5

        # Distance between movie ground truth and user belief (range 0.0 to 1.0)
        diff = abs(movie_val - user_val)

        # Scale between epsilon (0.05) and (1.0 - epsilon) (0.95)
        # diff = 0.0 -> 0.95
        # diff = 1.0 -> 0.05
        # diff = 0.5 -> 0.50
        likelihood = (1.0 - diff) * (1.0 - 2 * self.epsilon) + self.epsilon
        return max(self.epsilon, min(1.0 - self.epsilon, likelihood))

    def select_next_question(self, session: GameSession) -> Optional[Question]:
        """
        Selects the next best question by maximizing expected Information Gain.
        Aims for the question that splits the remaining probability mass closest to 50/50.
        """
        asked_ids = {h.question.id for h in session.history}
        available_questions = [q for q_id, q in self.questions.items() if q_id not in asked_ids]

        if not available_questions:
            return None

        best_question = None
        highest_score = -1.0

        for q in available_questions:
            # Calculate expected P(Yes) across current candidate probability distribution
            p_yes = 0.0
            for m_id, prob in session.probabilities.items():
                movie = self.movies[m_id]
                val = movie.attributes.get(q.id, 0.5)
                p_yes += prob * val

            # Clamp p_yes to avoid log(0)
            p_yes = max(1e-6, min(1.0 - 1e-6, p_yes))
            p_no = 1.0 - p_yes

            # Binary Entropy of the question: H(q) = - (p*log2(p) + (1-p)*log2(1-p))
            # H(q) is maximized at 1.0 bit when p_yes == 0.5 (perfect 50/50 split)
            question_entropy = -(p_yes * math.log2(p_yes) + p_no * math.log2(p_no))

            # Apply category/specific question weights
            score = question_entropy * q.weight

            if score > highest_score:
                highest_score = score
                best_question = q

        return best_question

    def submit_answer(
        self, session: GameSession, question: Question, answer: UserAnswer
    ) -> Tuple[Dict[str, float], bool]:
        """
        Updates candidate probabilities using Bayes' Theorem and records step.
        Returns: (updated_probabilities, is_game_ready_to_guess)
        """
        entropy_before = self.calculate_entropy(session.probabilities)
        top_before = self.get_top_candidate(session)[0]

        # Bayes rule: P(C_i | a) = P(C_i) * P(a | C_i, q) / Normalizer
        new_probs = {}
        for m_id, prior in session.probabilities.items():
            movie = self.movies[m_id]
            movie_val = movie.attributes.get(question.id, 0.5)
            likelihood = self.get_likelihood(movie_val, answer)
            new_probs[m_id] = prior * likelihood

        # Normalize
        total = sum(new_probs.values())
        if total > 0:
            for m_id in new_probs:
                new_probs[m_id] /= total
        else:
            # Fallback uniform if numerical underflow
            new_probs = {m_id: 1.0 / len(new_probs) for m_id in new_probs}

        session.probabilities = new_probs
        session.step_count += 1

        entropy_after = self.calculate_entropy(session.probabilities)
        top_after, top_prob = self.get_top_candidate(session)

        # Record history
        session.history.append(
            QuestionHistory(
                question=question,
                answer=answer,
                entropy_before=entropy_before,
                entropy_after=entropy_after,
                top_candidate_before=top_before,
                top_candidate_after=top_after,
            )
        )

        # Check stopping criteria
        is_ready = self.check_ready_to_guess(session)
        if is_ready:
            session.guessed_movie = self.movies.get(top_after)

        return session.probabilities, is_ready

    def check_ready_to_guess(self, session: GameSession) -> bool:
        """Determines if the engine has enough confidence to make a final guess."""
        top_m_id, top_prob = self.get_top_candidate(session)
        runner_up_m_id, runner_up_prob = self.get_runner_up_candidate(session)

        # Criteria 1: Reached confidence threshold (e.g. >= 82%)
        if top_prob >= session.confidence_threshold:
            return True

        # Criteria 2: Top candidate is dominant over runner-up (e.g. 70% vs 15%, ratio >= 3.5)
        if runner_up_prob > 0 and (top_prob / runner_up_prob) >= self.runner_up_ratio and top_prob >= 0.65:
            return True

        # Criteria 3: Reached max questions
        if session.step_count >= session.max_questions:
            return True

        return False

    def get_top_candidate(self, session: GameSession) -> Tuple[str, float]:
        """Returns the highest probability movie ID and its probability."""
        if not session.probabilities:
            return "", 0.0
        sorted_cands = sorted(session.probabilities.items(), key=lambda x: x[1], reverse=True)
        return sorted_cands[0]

    def get_runner_up_candidate(self, session: GameSession) -> Tuple[str, float]:
        """Returns the runner-up movie ID and its probability."""
        sorted_cands = sorted(session.probabilities.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_cands) > 1:
            return sorted_cands[1]
        return "", 0.0

    def eliminate_candidate_and_resume(self, session: GameSession, wrong_movie_id: str):
        """
        If the engine guessed wrong, penalize the wrong movie to zero/epsilon,
        renormalize remaining candidates, and allow the game to continue for 5 more questions.
        """
        session.probabilities[wrong_movie_id] = 0.0
        total = sum(session.probabilities.values())
        if total > 0:
            for m_id in session.probabilities:
                session.probabilities[m_id] /= total
        session.confidence_threshold = min(0.95, session.confidence_threshold + 0.05)
        session.max_questions += 5
        session.guessed_movie = None
