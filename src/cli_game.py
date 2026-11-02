#!/usr/bin/env python3
"""Interactive CLI Game for Movienator (Akinator for Indian Cinema).
Allows a player to think of an Indian movie and have Movienator guess it.
"""

import sys
import json
import argparse
from pathlib import Path

# Add src to path if executed directly
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir.parent))

from src.models import Movie, Question, UserAnswer
from src.engine import MovienatorEngine


def load_dataset(data_path: Path):
    with open(data_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    questions = [
        Question(
            id=q["id"],
            text=q["text"],
            category=q["category"],
            weight=q.get("weight", 1.0),
            description=q.get("description"),
        )
        for q in raw_data["questions"]
    ]

    movies = [
        Movie(
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
        for m in raw_data["movies"]
    ]

    return movies, questions


def print_banner():
    banner = """
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║   🎬  M O V I E N A T O R  :  I N D I A N   C I N E M A  🎬      ║
    ║       Think of any iconic Indian movie (Bollywood, Tollywood,    ║
    ║       Kollywood, Mollywood, Sandalwood) and I'll guess it!       ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """
    print(banner)


def prompt_user_answer(q_num: int, question: Question, debug: bool, session, engine) -> UserAnswer:
    print(f"\n👉 Question #{q_num}: {question.text}")
    if debug:
        top_cand, top_prob = engine.get_top_candidate(session)
        entropy = engine.calculate_entropy(session.probabilities)
        print(f"   [Debug | Top: {top_cand} ({top_prob:.1%}) | Entropy: {entropy:.2f} bits]")

    print("   [1] Yes (Y)")
    print("   [2] Probably / Partially (P)")
    print("   [3] Don't Know / Neutral (D)")
    print("   [4] Probably Not (PN)")
    print("   [5] No (N)")
    print("   [q] Quit Game")

    while True:
        choice = input("\nYour answer: ").strip().lower()
        if choice in ["1", "y", "yes"]:
            return UserAnswer.YES
        elif choice in ["2", "p", "probably"]:
            return UserAnswer.PROBABLY
        elif choice in ["3", "d", "dont know", "don't know", "neutral"]:
            return UserAnswer.DONT_KNOW
        elif choice in ["4", "pn", "probably not"]:
            return UserAnswer.PROBABLY_NOT
        elif choice in ["5", "n", "no"]:
            return UserAnswer.NO
        elif choice in ["q", "quit", "exit"]:
            print("\nExiting Movienator. Thanks for playing!")
            sys.exit(0)
        else:
            print("Invalid input. Please choose 1, 2, 3, 4, 5 or 'q'.")


def main():
    parser = argparse.ArgumentParser(description="Movienator CLI Game")
    parser.add_argument(
        "--data",
        type=str,
        default=str(current_dir.parent / "data" / "seed_movies.json"),
        help="Path to seed movies JSON",
    )
    parser.add_argument("--debug", action="store_true", help="Print debug probabilities during play")
    args = parser.parse_args()

    movies, questions = load_dataset(Path(args.data))
    engine = MovienatorEngine(movies=movies, questions=questions)
    session = engine.start_session()

    print_banner()
    print(f"Loaded {len(movies)} candidate movies and {len(questions)} distinct tropes.")
    print("Think of one of the movies... Press [Enter] when ready to begin!")
    input()

    while not session.is_completed:
        # Check if engine is ready to guess
        if engine.check_ready_to_guess(session) or session.step_count >= session.max_questions:
            top_m_id, prob = engine.get_top_candidate(session)
            guessed_movie = engine.movies[top_m_id]

            print("\n" + "=" * 60)
            print(f"💡 I THINK I GOT IT! (Confidence: {prob:.1%})")
            print(f"🎬 Are you thinking of:  🌟 {guessed_movie.title} ({guessed_movie.year}) 🌟")
            print(f"   Industry: {guessed_movie.industry}")
            print(f"   Directed by: {guessed_movie.director}")
            print(f"   Starring: {', '.join(guessed_movie.lead_cast)}")
            print("=" * 60)

            confirm = input("\nDid I guess right? [Y/N]: ").strip().lower()
            if confirm in ["y", "yes"]:
                print(f"\n🎉 Woohoo! Movienator guessed it in {session.step_count} questions!")
                print("\nQuestion Path:")
                for i, h in enumerate(session.history, 1):
                    print(f"  {i}. {h.question.text} -> {h.answer.value}")
                session.is_completed = True
                break
            else:
                print("\nAh, tricky one! Let me eliminate that and keep guessing...")
                engine.eliminate_candidate_and_resume(session, top_m_id)
                top_new, prob_new = engine.get_top_candidate(session)
                if not top_new or prob_new <= 0:
                    print("\nYou defeated me! I have run out of candidates in this dataset.")
                    break

        next_q = engine.select_next_question(session)
        if not next_q:
            print("\nI've run out of questions! My final guess is:")
            top_m_id, prob = engine.get_top_candidate(session)
            guessed_movie = engine.movies[top_m_id]
            print(f"🎬 {guessed_movie.title} ({guessed_movie.year})")
            break

        ans = prompt_user_answer(session.step_count + 1, next_q, args.debug, session, engine)
        engine.submit_answer(session, next_q, ans)


if __name__ == "__main__":
    main()
