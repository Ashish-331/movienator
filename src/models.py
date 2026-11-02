"""Data models for Movienator (Akinator for Indian Cinema).
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


class UserAnswer(str, Enum):
    YES = "yes"
    PROBABLY = "probably"
    DONT_KNOW = "dont_know"
    PROBABLY_NOT = "probably_not"
    NO = "no"

    @property
    def value_score(self) -> float:
        """Numerical target score representing the user's belief in the attribute."""
        scores = {
            UserAnswer.YES: 1.0,
            UserAnswer.PROBABLY: 0.75,
            UserAnswer.DONT_KNOW: 0.5,
            UserAnswer.PROBABLY_NOT: 0.25,
            UserAnswer.NO: 0.0,
        }
        return scores[self]


@dataclass
class Question:
    id: str
    text: str
    category: str
    weight: float = 1.0
    description: Optional[str] = None


@dataclass
class Movie:
    id: str
    title: str
    year: int
    industry: str
    director: str
    lead_cast: List[str]
    popularity: float = 1.0  # Base prior weight (log scale or 1-100)
    # Attribute mapping: question_id -> float (1.0 = definite Yes, 0.0 = definite No, 0.5 = neutral/unknown)
    attributes: Dict[str, float] = field(default_factory=dict)
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    poster_url: Optional[str] = None


@dataclass
class QuestionHistory:
    question: Question
    answer: UserAnswer
    entropy_before: float
    entropy_after: float
    top_candidate_before: str
    top_candidate_after: str


@dataclass
class GameSession:
    session_id: str
    history: List[QuestionHistory] = field(default_factory=list)
    probabilities: Dict[str, float] = field(default_factory=dict)
    step_count: int = 0
    confidence_threshold: float = 0.85
    max_questions: int = 25
    is_completed: bool = False
    guessed_movie: Optional[Movie] = None
