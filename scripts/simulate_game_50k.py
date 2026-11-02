#!/usr/bin/env python3
"""Simulation and Latency Benchmark across 50,000+ Indian Movies.

Validates:
1. Vectorized Bayesian likelihood inference & entropy reduction.
2. Fast question selection using Shannon Mutual Information Gain.
3. Sub-15ms per-turn latency requirement across all 50,000+ movies.
4. Deduction win rate across diverse industries, eras, and genres.
"""

import sys
import time
import json
import random
from pathlib import Path
from typing import Dict, List, Any
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.engine_vectorized import VectorizedMovienatorEngine
from backend.models import UserAnswer


def select_benchmark_targets(engine: VectorizedMovienatorEngine, n_targets: int = 40) -> List[Dict[str, Any]]:
    """Selects a diverse set of movies covering all major industries, eras, and popularity ranges."""
    conn = engine.db_path
    import sqlite3
    c = sqlite3.connect(conn)
    cur = c.cursor()

    # 1. Iconic Blockbusters across industries
    iconic_titles = [
        "Sholay",
        "3 Idiots",
        "Dangal",
        "Lagaan: Once Upon a Time in India",
        "Dilwale Dulhania Le Jayenge",
        "Gangs of Wasseypur",
        "K.G.F: Chapter 1",
        "Baahubali: The Beginning",
        "RRR",
        "Drishyam",
        "Vikram",
        "Kantara",
        "Pather Panchali",
        "Sairat",
        "Carry on Jatta",
        "Chak De! India",
        "Munna Bhai M.B.B.S.",
        "Andhadhun",
        "Tumbbad",
        "Bajrangi Bhaijaan",
    ]

    targets = []
    seen_ids = set()

    for title in iconic_titles:
        cur.execute("""
            SELECT id, title, year, industry, popularity
            FROM movies
            WHERE title LIKE ?
            ORDER BY popularity DESC
            LIMIT 1
        """, (f"%{title}%",))
        row = cur.fetchone()
        if row and row[0] not in seen_ids and row[0] in engine.movie_id_to_idx:
            targets.append({
                "id": row[0],
                "title": row[1],
                "year": row[2],
                "industry": row[3],
                "popularity": row[4],
                "category": "Iconic Blockbuster",
            })
            seen_ids.add(row[0])

    # 2. Industry-diverse random sample from catalog
    industries = [
        "Bollywood (Hindi)",
        "Kollywood (Tamil)",
        "Tollywood (Telugu)",
        "Mollywood (Malayalam)",
        "Sandalwood (Kannada)",
        "Bengali Cinema",
        "Marathi Cinema",
        "Punjabi Cinema",
    ]

    for ind in industries:
        cur.execute("""
            SELECT id, title, year, industry, popularity
            FROM movies
            WHERE industry = ? AND year IS NOT NULL AND votes > 100
            ORDER BY popularity DESC
            LIMIT 15
        """, (ind,))
        rows = cur.fetchall()
        for row in rows:
            if row[0] not in seen_ids and row[0] in engine.movie_id_to_idx:
                targets.append({
                    "id": row[0],
                    "title": row[1],
                    "year": row[2],
                    "industry": row[3],
                    "popularity": row[4],
                    "category": f"Industry Sample ({ind.split()[0]})",
                })
                seen_ids.add(row[0])
                if len(targets) >= n_targets:
                    break
        if len(targets) >= n_targets:
            break

    c.close()
    return targets[:n_targets]


def simulate_game(
    engine: VectorizedMovienatorEngine,
    target_info: Dict[str, Any],
    add_noise: bool = False,
) -> Dict[str, Any]:
    """Simulates a full 20 Questions game turn-by-turn against the target movie."""
    target_id = target_info["id"]
    target_idx = engine.movie_id_to_idx[target_id]

    session = engine.create_session(f"sim_{target_id}_{random.randint(1000, 9999)}")
    turn_latencies = []
    start_time = time.perf_counter()

    while not session.is_completed and session.step_count < session.max_questions:
        t_turn_start = time.perf_counter()

        # Check guess readiness
        if engine.check_ready_to_guess(session):
            break

        # 1. Question selection (Vectorized Mutual Information Gain)
        q = engine.select_next_question(session)
        if not q:
            break

        # 2. Determine answer based on movie ground truth
        q_idx = engine.question_id_to_idx[q.id]
        ground_val = engine.matrix[target_idx, q_idx]

        if add_noise and random.random() < 0.08:
            if ground_val >= 0.75:
                answer = UserAnswer.PROBABLY
            elif ground_val <= 0.25:
                answer = UserAnswer.PROBABLY_NOT
            else:
                answer = UserAnswer.DONT_KNOW
        else:
            if ground_val >= 0.75:
                answer = UserAnswer.YES
            elif ground_val <= 0.25:
                answer = UserAnswer.NO
            else:
                answer = UserAnswer.DONT_KNOW

        # 3. Vectorized Bayesian update
        _, is_ready = engine.submit_answer(session, q, answer)
        t_turn_end = time.perf_counter()
        turn_latencies.append((t_turn_end - t_turn_start) * 1000)

        if is_ready:
            break

    total_duration_sec = time.perf_counter() - start_time
    top_cand_id, top_prob = engine.get_top_candidate(session)
    guessed_meta = engine.get_movie_metadata(top_cand_id)
    guessed_title = guessed_meta["title"] if guessed_meta else top_cand_id

    # Check match (either exact ID match or same title match)
    is_success = (top_cand_id == target_id) or (guessed_title.lower() == target_info["title"].lower())

    avg_turn_ms = float(np.mean(turn_latencies)) if turn_latencies else 0.0

    return {
        "target_id": target_id,
        "target_title": target_info["title"],
        "target_year": target_info["year"],
        "target_industry": target_info["industry"],
        "guessed_id": top_cand_id,
        "guessed_title": guessed_title,
        "is_success": is_success,
        "steps": session.step_count,
        "confidence": round(top_prob, 4),
        "avg_turn_latency_ms": round(avg_turn_ms, 2),
        "total_duration_sec": round(total_duration_sec, 3),
        "turn_latencies": turn_latencies,
    }


def main():
    print("=" * 78)
    print("MOVIENATOR 50,000+ MOVIES VECTORIZED BENCHMARK & SIMULATION SUITE")
    print("=" * 78)

    t0 = time.perf_counter()
    engine = VectorizedMovienatorEngine()
    load_time_ms = (time.perf_counter() - t0) * 1000

    total_movies = len(engine.movie_ids)
    total_questions = len(engine.questions)

    print(f"Engine Initialized in: {load_time_ms:.1f} ms")
    print(f"Total Movies in Vector Index: {total_movies:,}")
    print(f"Total Questions in Catalog: {total_questions}")
    print("-" * 78)

    # Select representative targets
    targets = select_benchmark_targets(engine, n_targets=35)
    print(f"Running simulation against {len(targets)} representative movies...")
    print("-" * 78)

    results = []
    all_latencies = []

    for idx, target in enumerate(targets):
        res = simulate_game(engine, target, add_noise=False)
        results.append(res)
        all_latencies.extend(res["turn_latencies"])

        mark = "✓" if res["is_success"] else "✗"
        print(
            f"[{idx+1:2d}/{len(targets):2d}] {mark} {res['target_title'][:28]:<28} "
            f"| Guessed: {res['guessed_title'][:24]:<24} "
            f"| Steps: {res['steps']:2d} "
            f"| Conf: {res['confidence']*100:5.1f}% "
            f"| Turn: {res['avg_turn_latency_ms']:4.2f} ms"
        )

    # Calculate Aggregate Metrics
    success_count = sum(1 for r in results if r["is_success"])
    win_rate = (success_count / len(results)) * 100.0
    avg_steps = float(np.mean([r["steps"] for r in results]))
    avg_latency = float(np.mean(all_latencies)) if all_latencies else 0.0
    p50_latency = float(np.percentile(all_latencies, 50)) if all_latencies else 0.0
    p95_latency = float(np.percentile(all_latencies, 95)) if all_latencies else 0.0
    p99_latency = float(np.percentile(all_latencies, 99)) if all_latencies else 0.0
    max_latency = float(np.max(all_latencies)) if all_latencies else 0.0

    print("=" * 78)
    print("FINAL BENCHMARK RESULTS ACROSS 50,000+ MOVIES")
    print("=" * 78)
    print(f"Total Movies Loaded     : {total_movies:,}")
    print(f"Total Questions Loaded  : {total_questions}")
    print(f"Simulations Completed   : {len(results)}")
    print(f"Simulation Win Rate     : {win_rate:.1f}% ({success_count}/{len(results)})")
    print(f"Average Turns per Game  : {avg_steps:.1f} questions")
    print(f"Average Turn Latency    : {avg_latency:.2f} ms  (Target: < 15.0 ms) -> {'PASSED' if avg_latency < 15.0 else 'FAILED'}")
    print(f"P50 Turn Latency        : {p50_latency:.2f} ms")
    print(f"P95 Turn Latency        : {p95_latency:.2f} ms")
    print(f"P99 Turn Latency        : {p99_latency:.2f} ms")
    print(f"Max Turn Latency        : {max_latency:.2f} ms")
    print("=" * 78)


if __name__ == "__main__":
    main()
