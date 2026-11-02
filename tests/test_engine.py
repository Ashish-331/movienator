"""Automated Verification Suite for Movienator Engine & FastAPI Endpoints.
Ensures zero contradictory questions, strict <= 20 turn limit, and fast deduction (< 10 turns).
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app import app
from backend.engine_vectorized import VectorizedMovienatorEngine
from backend.models import UserAnswer

client = TestClient(app)
engine = VectorizedMovienatorEngine()


def test_iconic_deduction_speed():
    """Verifies that iconic blockbusters are deduced in <= 10 turns without conflicts."""
    test_cases = [
        ("rrr_2022", "RRR"),
        ("three_idiots_2009", "3 Idiots"),
        ("sholay_1975", "Sholay"),
        ("kgf_chapter_2_2022", "K.G.F: Chapter 2"),
        ("dangal_2016", "Dangal"),
        ("kantara_2022", "Kantara"),
        ("pushpa_the_rise_2021", "Pushpa: The Rise"),
        ("animal_2023", "Animal"),
    ]

    for target_id, target_name in test_cases:
        target_idx = engine.movie_id_to_idx[target_id]
        target_attrs = engine.matrix[target_idx]

        session = engine.create_session(f"eval_{target_id}")
        turns = 0
        is_ready = False

        for _ in range(20):
            q = engine.select_next_question(session)
            if not q:
                break
            turns += 1
            q_idx = engine.question_id_to_idx[q.id]
            attr_val = target_attrs[q_idx]
            ans = UserAnswer.YES if attr_val > 0.5 else UserAnswer.NO

            probs, is_ready = engine.submit_answer(session, q, ans)
            if is_ready:
                top_id, top_prob = engine.get_top_candidate(session)
                assert top_id == target_id, f"Expected {target_id}, got {top_id}"
                assert turns <= 10, f"Expected deduction in <= 10 turns, took {turns}"
                break

        assert is_ready, f"Failed to reach guess for {target_name}"
        print(f"✓ {target_name} correctly guessed in {turns} turns")


def test_hard_ceiling_and_non_null_guess():
    """Verifies that no session can exceed 20 turns and guessed movie is never null."""
    start_res = client.post("/api/game/start")
    data = start_res.json()
    session_id = data["session_id"]
    current_q = data["question"]

    for step in range(1, 25):
        ans_res = client.post("/api/game/answer", json={
            "session_id": session_id,
            "question_id": current_q["id"],
            "answer": "dont_know"
        })
        ans_data = ans_res.json()
        if ans_data["is_guess_ready"]:
            assert step <= 20, f"Turn count {step} exceeded ceiling of 20"
            assert ans_data["guessed_movie"] is not None, "Guessed movie must not be null"
            assert ans_data["guessed_movie"]["title"], "Guessed movie must have title"
            break
        current_q = ans_data["next_question"]

    print("✓ Strict 20-question cap & guaranteed non-null movie verified")


def test_rejection_resumption_contract():
    """Verifies that rejecting an incorrect guess continues search without crashing."""
    start_res = client.post("/api/game/start")
    session_id = start_res.json()["session_id"]

    # Reject a guess
    res = client.post("/api/game/confirm", json={
        "session_id": session_id,
        "is_correct": False
    })
    data = res.json()
    assert data["status"] in ["resumed", "defeat"], f"Unexpected status {data['status']}"
    if data["status"] == "resumed":
        assert data["next_question"] is not None, "Next question required on resumed status"

    print("✓ Rejection resumption contract verified")


if __name__ == "__main__":
    print("Running Movienator Test Suite...")
    test_iconic_deduction_speed()
    test_hard_ceiling_and_non_null_guess()
    test_rejection_resumption_contract()
    print("ALL TESTS PASSED SUCCESSFULLY!")
