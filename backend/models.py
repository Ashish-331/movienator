"""Pydantic Models and Data Schemas for Movienator Backend.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class UserAnswer(str, Enum):
    YES = "yes"
    PROBABLY = "probably"
    DONT_KNOW = "dont_know"
    PROBABLY_NOT = "probably_not"
    NO = "no"

    @property
    def value_score(self) -> float:
        scores = {
            UserAnswer.YES: 1.0,
            UserAnswer.PROBABLY: 0.75,
            UserAnswer.DONT_KNOW: 0.5,
            UserAnswer.PROBABLY_NOT: 0.25,
            UserAnswer.NO: 0.0,
        }
        return scores[self]


class QuestionModel(BaseModel):
    id: str
    text: str
    category: str
    weight: float = 1.0
    description: Optional[str] = None


class MovieModel(BaseModel):
    id: str
    title: str
    year: int
    industry: str
    director: str
    lead_cast: List[str]
    popularity: float = 1.0
    poster_url: Optional[str] = None


# Core Data Classes for Engine
class Question:
    def __init__(self, id: str, text: str, category: str, weight: float = 1.0, description: Optional[str] = None):
        self.id = id
        self.text = text
        self.category = category
        self.weight = weight
        self.description = description


class Movie:
    def __init__(
        self,
        id: str,
        title: str,
        year: int,
        industry: str,
        director: str,
        lead_cast: List[str],
        popularity: float = 1.0,
        attributes: Optional[Dict[str, float]] = None,
        poster_url: Optional[str] = None,
    ):
        self.id = id
        self.title = title
        self.year = year
        self.industry = industry
        self.director = director
        self.lead_cast = lead_cast
        self.popularity = popularity
        self.attributes = attributes or {}
        self.poster_url = poster_url


class QuestionHistoryItem(BaseModel):
    question_id: str
    question_text: str
    category: str
    answer: UserAnswer
    top_candidate: str
    confidence: float
    entropy: float


class GameSession:
    def __init__(
        self,
        session_id: str,
        probabilities: Dict[str, float],
        confidence_threshold: float = 0.82,
        max_questions: int = 25,
    ):
        self.session_id = session_id
        self.probabilities = probabilities
        self.history: List[QuestionHistoryItem] = []
        self.step_count = 0
        self.confidence_threshold = confidence_threshold
        self.max_questions = max_questions
        self.is_completed = False
        self.guessed_movie_id: Optional[str] = None
        # Snapshots for undo capability
        self.probability_snapshots: List[Dict[str, float]] = [dict(probabilities)]


# API Request/Response Models
class StartGameResponse(BaseModel):
    session_id: str
    question_number: int
    question: QuestionModel
    entropy: float
    confidence: float
    total_movies: int
    total_questions: int


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: UserAnswer


class AnswerResponse(BaseModel):
    session_id: str
    question_number: int
    is_guess_ready: bool
    entropy: float
    confidence: float
    next_question: Optional[QuestionModel] = None
    guessed_movie: Optional[MovieModel] = None
    runner_up_movie: Optional[MovieModel] = None
    top_candidates_preview: List[Dict[str, Any]] = []


class ConfirmRequest(BaseModel):
    session_id: str
    is_correct: bool


class ConfirmResponse(BaseModel):
    session_id: str
    status: str
    message: str
    needs_teaching: bool = False
    next_question: Optional[QuestionModel] = None
    confidence: Optional[float] = None
    entropy: Optional[float] = None
    top_candidates_preview: List[Dict[str, Any]] = []


class TeachRequest(BaseModel):
    session_id: str
    movie_title: str
    year: int
    industry: str
    director: str
    lead_cast: List[str]
    distinguishing_question: Optional[str] = None
    answer_for_target: Optional[UserAnswer] = None
    answer_for_guess: Optional[UserAnswer] = None


class TeachResponse(BaseModel):
    status: str
    message: str
    movie_id: str
