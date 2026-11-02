"""High-Performance SQLite and Memory Data Manager for Movienator Backend.
Supports fast indexed search, pagination, and caching across 50,000+ Indian movies.
"""

import json
import sqlite3
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Iterator
from .models import Movie, Question, UserAnswer

DATA_DIR = Path(__file__).resolve().parent / "data"
DB_FILE = DATA_DIR / "movies_50k.db"
QUESTIONS_FILE = DATA_DIR / "questions_catalog.json"
LEGACY_FILE = DATA_DIR / "indian_cinema.json"


class MovieDictProxy:
    """Provides high-performance dict-like interface over 50,000+ movies."""

    def __init__(self, repo: "MovieRepository"):
        self._repo = repo

    def __getitem__(self, item: str) -> Movie:
        m = self._repo.get_movie(item)
        if m is None:
            raise KeyError(item)
        return m

    def get(self, item: str, default: Optional[Any] = None) -> Optional[Movie]:
        m = self._repo.get_movie(item)
        return m if m is not None else default

    def __len__(self) -> int:
        return self._repo.get_total_count()

    def __contains__(self, item: str) -> bool:
        return self._repo.get_movie(item) is not None

    def values(self) -> List[Movie]:
        return self._repo.get_top_movies_list(limit=5000)

    def items(self) -> List[tuple]:
        return [(m.id, m) for m in self.values()]


class MovieRepository:
    def __init__(
        self,
        db_path: Path = DB_FILE,
        questions_path: Path = QUESTIONS_FILE,
        legacy_path: Path = LEGACY_FILE,
    ):
        self.db_path = db_path
        self.questions_path = questions_path
        self.legacy_path = legacy_path

        self.questions: Dict[str, Question] = {}
        self._memory_cache: Dict[str, Movie] = {}
        self._total_count = 0
        self.movies = MovieDictProxy(self)

        self.load()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def load(self):
        """Loads questions catalog and primes memory cache with top movies."""
        # 1. Load questions
        if self.questions_path.exists():
            with open(self.questions_path, "r", encoding="utf-8") as f:
                q_list = json.load(f)
                self.questions = {
                    q["id"]: Question(
                        id=q["id"],
                        text=q["text"],
                        category=q["category"],
                        weight=float(q.get("weight", 1.0)),
                        description=q.get("description"),
                    )
                    for q in q_list
                }
        elif self.legacy_path.exists():
            with open(self.legacy_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.questions = {
                    q["id"]: Question(
                        id=q["id"],
                        text=q["text"],
                        category=q["category"],
                        weight=float(q.get("weight", 1.0)),
                        description=q.get("description"),
                    )
                    for q in data.get("questions", [])
                }

        # 2. Prime cache and get total count
        if self.db_path.exists():
            conn = self._get_connection()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM movies")
            self._total_count = cur.fetchone()[0]

            # Cache top 2500 movies in memory for instant lookups
            cur.execute("""
                SELECT id, title, year, industry, director, lead_cast, popularity, poster_url
                FROM movies
                ORDER BY popularity DESC
                LIMIT 2500
            """)
            for r in cur.fetchall():
                lead_cast = []
                if r["lead_cast"]:
                    try:
                        lead_cast = json.loads(r["lead_cast"]) if isinstance(r["lead_cast"], str) else r["lead_cast"]
                    except Exception:
                        lead_cast = []
                self._memory_cache[r["id"]] = Movie(
                    id=r["id"],
                    title=r["title"],
                    year=r["year"] or 0,
                    industry=r["industry"],
                    director=r["director"] or "Unknown",
                    lead_cast=lead_cast,
                    popularity=float(r["popularity"]),
                    poster_url=r["poster_url"],
                )
            conn.close()

    def get_total_count(self) -> int:
        return self._total_count

    def get_movie(self, movie_id: str) -> Optional[Movie]:
        """Fetches a movie by ID with cache-first resolution."""
        if movie_id in self._memory_cache:
            return self._memory_cache[movie_id]

        if not self.db_path.exists():
            return None

        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, year, industry, director, lead_cast, popularity, poster_url
            FROM movies WHERE id = ?
        """, (movie_id,))
        row = cur.fetchone()
        conn.close()

        if not row:
            return None

        lead_cast = []
        if row["lead_cast"]:
            try:
                lead_cast = json.loads(row["lead_cast"]) if isinstance(row["lead_cast"], str) else row["lead_cast"]
            except Exception:
                lead_cast = []

        movie = Movie(
            id=row["id"],
            title=row["title"],
            year=row["year"] or 0,
            industry=row["industry"],
            director=row["director"] or "Unknown",
            lead_cast=lead_cast,
            popularity=float(row["popularity"]),
            poster_url=row["poster_url"],
        )
        self._memory_cache[movie_id] = movie
        return movie

    def get_top_movies_list(self, limit: int = 5000) -> List[Movie]:
        """Returns top movies as a list."""
        if not self.db_path.exists():
            return list(self._memory_cache.values())

        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, title, year, industry, director, lead_cast, popularity, poster_url
            FROM movies
            ORDER BY popularity DESC
            LIMIT ?
        """, (limit,))
        movies = []
        for r in cur.fetchall():
            lead_cast = []
            if r["lead_cast"]:
                try:
                    lead_cast = json.loads(r["lead_cast"]) if isinstance(r["lead_cast"], str) else r["lead_cast"]
                except Exception:
                    lead_cast = []
            movies.append(
                Movie(
                    id=r["id"],
                    title=r["title"],
                    year=r["year"] or 0,
                    industry=r["industry"],
                    director=r["director"] or "Unknown",
                    lead_cast=lead_cast,
                    popularity=float(r["popularity"]),
                    poster_url=r["poster_url"],
                )
            )
        conn.close()
        return movies

    def search_movies(
        self,
        query: str,
        limit: int = 10,
        language: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fast indexed search across 50,000+ movies in sub-millisecond time."""
        q = query.strip()
        if not q or not self.db_path.exists():
            return []

        conn = self._get_connection()
        cur = conn.cursor()

        # Flexible pattern matching: "kgf" -> "%k%g%f%"
        clean_q = re.sub(r"[^a-zA-Z0-9]", "", q)
        if len(clean_q) >= 2 and len(clean_q) <= 5:
            wildcard_pattern = "%" + "%".join(clean_q) + "%"
        else:
            wildcard_pattern = f"%{q}%"

        direct_pattern = f"%{q}%"

        params: List[Any] = [direct_pattern, wildcard_pattern, direct_pattern, direct_pattern]
        lang_clause = ""
        if language and language.lower() != "all":
            lang_clause = "AND (language = ? OR industry LIKE ?)"
            params.extend([language.lower(), f"%{language}%"])

        params.append(limit)

        cur.execute(f"""
            SELECT id, title, year, industry, director, lead_cast, poster_url, popularity
            FROM movies
            WHERE (title LIKE ? OR title LIKE ? OR director LIKE ? OR lead_cast LIKE ?)
            {lang_clause}
            ORDER BY popularity DESC
            LIMIT ?
        """, tuple(params))

        results = []
        for r in cur.fetchall():
            lead_cast = []
            if r["lead_cast"]:
                try:
                    lead_cast = json.loads(r["lead_cast"]) if isinstance(r["lead_cast"], str) else r["lead_cast"]
                except Exception:
                    lead_cast = []
            results.append({
                "id": r["id"],
                "title": r["title"],
                "year": r["year"],
                "industry": r["industry"],
                "director": r["director"],
                "lead_cast": lead_cast,
                "poster_url": r["poster_url"],
                "popularity": float(r["popularity"]),
            })

        conn.close()
        return results

    def get_all_movies(
        self,
        page: int = 1,
        limit: int = 50,
        language: Optional[str] = None,
        query: Optional[str] = None,
        era_min: Optional[int] = None,
        era_max: Optional[int] = None,
        sort_by: str = "popularity",
    ) -> Dict[str, Any]:
        """Paginated catalog retrieval over 50,000+ movies."""
        import math
        if not self.db_path.exists():
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}

        conn = self._get_connection()
        cur = conn.cursor()

        offset = max(0, (page - 1) * limit)
        clauses = []
        params: List[Any] = []

        if language and language.lower() != "all":
            clauses.append("(language = ? OR industry LIKE ?)")
            params.extend([language.lower(), f"%{language}%"])

        if query and query.strip():
            clauses.append("(title LIKE ? OR director LIKE ?)")
            params.extend([f"%{query.strip()}%", f"%{query.strip()}%"])

        if era_min is not None and era_max is not None:
            clauses.append("year >= ? AND year <= ?")
            params.extend([era_min, era_max])

        where_str = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        order_col = "popularity DESC" if sort_by == "popularity" else "year DESC"

        # Count total matching rows
        cur.execute(f"SELECT COUNT(*) FROM movies {where_str}", tuple(params))
        total_count = cur.fetchone()[0]

        # Retrieve page items
        item_params = list(params) + [limit, offset]
        cur.execute(f"""
            SELECT id, title, year, industry, director, lead_cast, poster_url, popularity
            FROM movies
            {where_str}
            ORDER BY {order_col}
            LIMIT ? OFFSET ?
        """, tuple(item_params))

        results = []
        for r in cur.fetchall():
            lead_cast = []
            if r["lead_cast"]:
                try:
                    lead_cast = json.loads(r["lead_cast"]) if isinstance(r["lead_cast"], str) else r["lead_cast"]
                except Exception:
                    lead_cast = []
            results.append({
                "id": r["id"],
                "title": r["title"],
                "year": r["year"],
                "industry": r["industry"],
                "director": r["director"],
                "lead_cast": lead_cast,
                "poster_url": r["poster_url"],
                "popularity": float(r["popularity"]),
            })

        conn.close()
        return {
            "items": results,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": max(1, math.ceil(total_count / max(1, limit))),
        }

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics breakdown by industry across all movies."""
        if not self.db_path.exists():
            return {
                "total_movies": self._total_count,
                "total_questions": len(self.questions),
                "industry_breakdown": {},
            }

        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT industry, COUNT(*) FROM movies GROUP BY industry ORDER BY COUNT(*) DESC")
        breakdown = {r[0]: r[1] for r in cur.fetchall()}
        conn.close()

        return {
            "total_movies": self._total_count,
            "total_questions": len(self.questions),
            "industry_breakdown": breakdown,
        }

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
        """Adds or updates a taught movie in database and memory."""
        m_id = f"{title.lower().replace(' ', '_').replace(':', '')}_{year}"
        movie = Movie(
            id=m_id,
            title=title,
            year=year,
            industry=industry,
            director=director,
            lead_cast=lead_cast,
            popularity=2.5,
            attributes=attributes or {},
            poster_url=poster_url or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500",
        )
        self._memory_cache[m_id] = movie

        if self.db_path.exists():
            conn = self._get_connection()
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO movies (
                    id, title, year, industry, language, timing_min, rating, votes,
                    genres, director, lead_cast, popularity, poster_url, imdb_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    year=excluded.year,
                    industry=excluded.industry,
                    director=excluded.director,
                    lead_cast=excluded.lead_cast,
                    popularity=movies.popularity + 0.5
            """, (
                m_id, title, year, industry, industry.lower().split()[0],
                135, 7.5, 1000, json.dumps(["Drama"]), director,
                json.dumps(lead_cast), 2.5, movie.poster_url, None,
            ))
            conn.commit()
            conn.close()
            self._total_count += 1

        return movie

    def add_distinguishing_question(
        self,
        question_text: str,
        category: str = "trope",
        target_movie_id: Optional[str] = None,
        guess_movie_id: Optional[str] = None,
    ) -> Question:
        """Adds a distinguishing question for continuous online learning."""
        q_id = "q_" + question_text.lower().replace(" ", "_")[:32].strip("?")
        if q_id not in self.questions:
            q = Question(id=q_id, text=question_text, category=category, weight=1.1)
            self.questions[q_id] = q
        else:
            q = self.questions[q_id]

        # Persist to questions catalog
        if self.questions_path.exists():
            with open(self.questions_path, "r", encoding="utf-8") as f:
                q_list = json.load(f)
            if not any(item["id"] == q.id for item in q_list):
                q_list.append({
                    "id": q.id,
                    "text": q.text,
                    "category": q.category,
                    "weight": q.weight,
                })
                with open(self.questions_path, "w", encoding="utf-8") as f:
                    json.dump(q_list, f, indent=2)

        return q


# Global singleton repository
repo = MovieRepository()
