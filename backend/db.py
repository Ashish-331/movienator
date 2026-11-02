"""Database and In-Memory Data Manager for Movienator Backend.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from .models import Movie, Question, UserAnswer


DATA_FILE = Path(__file__).resolve().parent / "data" / "indian_cinema.json"


class MovieRepository:
    def __init__(self, data_path: Path = DATA_FILE):
        self.data_path = data_path
        self.movies: Dict[str, Movie] = {}
        self.questions: Dict[str, Question] = {}
        self.load()

    def load(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.questions = {
            q["id"]: Question(
                id=q["id"],
                text=q["text"],
                category=q["category"],
                weight=q.get("weight", 1.0),
                description=q.get("description"),
            )
            for q in data["questions"]
        }

        self.movies = {
            m["id"]: Movie(
                id=m["id"],
                title=m["title"],
                year=m["year"],
                industry=m["industry"],
                director=m["director"],
                lead_cast=m["lead_cast"],
                popularity=m.get("popularity", 1.0),
                attributes=m.get("attributes", {}),
                poster_url=m.get("poster_url"),
            )
            for m in data["movies"]
        }

    def save(self):
        """Persists movies and questions back to JSON."""
        data = {
            "questions": [
                {
                    "id": q.id,
                    "text": q.text,
                    "category": q.category,
                    "weight": q.weight,
                    "description": q.description,
                }
                for q in self.questions.values()
            ],
            "movies": [
                {
                    "id": m.id,
                    "title": m.title,
                    "year": m.year,
                    "industry": m.industry,
                    "director": m.director,
                    "lead_cast": m.lead_cast,
                    "popularity": m.popularity,
                    "attributes": m.attributes,
                    "poster_url": m.poster_url,
                }
                for m in self.movies.values()
            ],
        }
        with open(self.data_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def search_movies(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search movies by title, director, or cast."""
        q = query.lower().strip()
        matches = []
        for m in self.movies.values():
            if (
                q in m.title.lower()
                or q in m.director.lower()
                or any(q in actor.lower() for actor in m.lead_cast)
            ):
                matches.append({
                    "id": m.id,
                    "title": m.title,
                    "year": m.year,
                    "industry": m.industry,
                    "director": m.director,
                    "lead_cast": m.lead_cast,
                    "poster_url": m.poster_url,
                })
                if len(matches) >= limit:
                    break
        return matches

    def add_or_update_movie(
        self,
        title: str,
        year: int,
        industry: str,
        director: str,
        lead_cast: List[str],
        poster_url: Optional[str] = None,
        attributes: Optional[Dict[str, float]] = None,
    ) -> Movie:
        m_id = f"{title.lower().replace(' ', '_').replace(':', '')}_{year}"
        if m_id in self.movies:
            movie = self.movies[m_id]
            if attributes:
                movie.attributes.update(attributes)
            movie.popularity += 0.5
        else:
            movie = Movie(
                id=m_id,
                title=title,
                year=year,
                industry=industry,
                director=director,
                lead_cast=lead_cast,
                popularity=1.5,
                attributes=attributes or {},
                poster_url=poster_url or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
            )
            self.movies[m_id] = movie
        self.save()
        return movie

    def add_distinguishing_question(
        self,
        question_text: str,
        category: str = "trope",
        target_movie_id: Optional[str] = None,
        guess_movie_id: Optional[str] = None,
    ) -> Question:
        q_id = "q_" + question_text.lower().replace(" ", "_")[:32].strip("?")
        if q_id not in self.questions:
            q = Question(id=q_id, text=question_text, category=category, weight=1.1)
            self.questions[q_id] = q
        else:
            q = self.questions[q_id]

        if target_movie_id and target_movie_id in self.movies:
            self.movies[target_movie_id].attributes[q_id] = 1.0
        if guess_movie_id and guess_movie_id in self.movies:
            self.movies[guess_movie_id].attributes[q_id] = 0.0

        self.save()
        return q


# Global singleton repository
repo = MovieRepository()
