"""Logical Semantic Constraints and Dependency Propagation Engine.

Guarantees zero conflicting, contradictory, or redundant questions during gameplay:
1. Mutually Exclusive Invariants:
   - Language / Industry: Only one language can be true.
   - Era / Decade: A film belongs to exactly one release decade.
   - Runtime: Runtime is partitioned into (>150), (<110), or (110-150).
2. Hierarchical Bisections:
   - South Indian encompasses [Tamil, Telugu, Malayalam, Kannada].
   - 21st Century (post-2000) encompasses [2000s, 2010s, post-2020].
3. Implication Rules:
   - Not Comedy => Not Pure Comedy / Not Horror-Comedy.
   - Not Romance => Not Romantic Drama / Not Love Triangle.
   - Not Crime => Not Mafia / Not Heist / Not Murder Investigation.
   - Not Action => Not Revenge Story.
   - Not IMDb >= 7.5 => Not IMDb >= 8.0.
   - High Blockbuster Votes => Not Niche/Cult.
4. Star-Language Incompatibilities:
   - South Indian film => Mask Bollywood star leads.
   - Hindi film => Mask South Indian star leads.
"""

from typing import Dict, List, Set, Tuple, Optional
import numpy as np


class ConstraintManager:
    """Manages logical question dependencies and prevents conflicting questions."""

    # Categorical groups where values are mutually exclusive
    MUTUALLY_EXCLUSIVE_GROUPS = {
        "language": [
            "is_hindi",
            "is_telugu",
            "is_tamil",
            "is_malayalam",
            "is_kannada",
            "is_bengali",
            "is_marathi",
            "is_punjabi",
            "is_regional_or_other",
        ],
        "era_buckets": [
            "released_pre_1970",
            "released_1970_1989",
            "released_1990_1999",
            "released_2000s",
            "released_2010s",
            "released_post_2020",
        ],
        "runtime": [
            "is_epic_runtime_150_plus",
            "is_compact_runtime_under_110",
            "is_standard_runtime",
        ],
        "star_actors": [
            "stars_shah_rukh_khan",
            "stars_aamir_khan",
            "stars_salman_khan",
            "stars_amitabh_bachchan",
            "stars_rajinikanth",
            "stars_kamal_haasan",
            "stars_prabhas",
            "stars_allu_arjun",
            "stars_yash",
            "stars_mohanlal_or_mammootty",
            "stars_ranbir_kapoor_or_ranveer_singh",
            "stars_ayushmann_or_rajkummar",
        ],
    }

    # Macro-level bisections and their children
    HIERARCHIES = {
        "is_south_indian": ["is_telugu", "is_tamil", "is_malayalam", "is_kannada"],
        "released_post_2000": ["released_2000s", "released_2010s", "released_post_2020"],
    }

    BOLLYWOOD_STARS = [
        "stars_shah_rukh_khan", "stars_salman_khan", "stars_aamir_khan",
        "stars_amitabh_bachchan", "stars_ranbir_kapoor_or_ranveer_singh",
        "stars_ayushmann_or_rajkummar"
    ]

    SOUTH_STARS = [
        "stars_rajinikanth", "stars_kamal_haasan", "stars_prabhas",
        "stars_allu_arjun", "stars_yash", "stars_mohanlal_or_mammootty"
    ]

    # Negative / Positive implications of major splitters
    MAJOR_SPLIT_RULES = {
        "released_post_2000": {
            "if_yes_mask": ["released_pre_1970", "released_1970_1989", "released_1990_1999"],
            "if_no_mask": ["released_post_2000", "released_2000s", "released_2010s", "released_post_2020"],
        },
        "is_south_indian": {
            "if_yes_mask": [
                "is_hindi", "is_bengali", "is_marathi", "is_punjabi", "is_regional_or_other",
                "stars_shah_rukh_khan", "stars_salman_khan", "stars_aamir_khan",
                "stars_amitabh_bachchan", "stars_ranbir_kapoor_or_ranveer_singh",
                "stars_ayushmann_or_rajkummar"
            ],
            "if_no_mask": [
                "is_south_indian", "is_telugu", "is_tamil", "is_malayalam", "is_kannada",
                "stars_rajinikanth", "stars_kamal_haasan", "stars_prabhas",
                "stars_allu_arjun", "stars_yash", "stars_mohanlal_or_mammootty"
            ],
        },
        "is_hindi": {
            "if_yes_mask": [
                "is_south_indian", "is_telugu", "is_tamil", "is_malayalam", "is_kannada",
                "is_bengali", "is_marathi", "is_punjabi", "is_regional_or_other",
                "stars_rajinikanth", "stars_kamal_haasan", "stars_prabhas",
                "stars_allu_arjun", "stars_yash", "stars_mohanlal_or_mammootty"
            ],
            "if_no_mask": ["is_hindi"],
        },
    }

    # Directed implications: (question_id, answer_val) -> list of questions to mask
    IMPLICATION_RULES = {
        # Genre exclusions
        ("is_comedy", "no"): ["is_pure_comedy_or_satire", "features_horror_comedy"],
        ("is_pure_comedy_or_satire", "yes"): ["is_comedy"],
        ("is_romance", "no"): ["is_romantic_drama", "has_love_triangle"],
        ("is_romantic_drama", "yes"): ["is_romance"],
        ("is_action", "no"): ["is_revenge_story"],
        ("is_crime", "no"): ["features_mafia_or_gangster", "features_heist_or_con", "has_murder_investigation"],
        ("is_horror", "no"): ["features_horror_comedy"],

        # Reception exclusions
        ("is_highly_rated_imdb_7_5", "no"): ["is_masterpiece_imdb_8_0"],
        ("is_masterpiece_imdb_8_0", "yes"): ["is_highly_rated_imdb_7_5"],
        ("is_popular_blockbuster_votes", "yes"): ["is_cult_or_niche"],
        ("is_cult_or_niche", "yes"): ["is_popular_blockbuster_votes", "is_pan_india"],

        # Star Actor confirmations
        ("stars_shah_rukh_khan", "yes"): ["is_south_indian", "is_telugu", "is_tamil", "is_malayalam", "is_kannada"],
        ("stars_aamir_khan", "yes"): ["is_south_indian", "is_telugu", "is_tamil", "is_malayalam", "is_kannada"],
        ("stars_salman_khan", "yes"): ["is_south_indian", "is_telugu", "is_tamil", "is_malayalam", "is_kannada"],
        ("stars_rajinikanth", "yes"): ["is_hindi", "is_telugu", "is_malayalam", "is_kannada", "is_bengali", "is_marathi"],
        ("stars_yash", "yes"): ["is_hindi", "is_telugu", "is_tamil", "is_malayalam", "is_bengali"],
        ("stars_prabhas", "yes"): ["is_hindi", "is_tamil", "is_malayalam", "is_kannada", "is_bengali"],
        ("stars_allu_arjun", "yes"): ["is_hindi", "is_tamil", "is_malayalam", "is_kannada", "is_bengali"],
    }

    @classmethod
    def get_hard_factual_questions(cls) -> Set[str]:
        """Returns set of question IDs that represent strict factual ground-truth."""
        hard = set()
        for group in cls.MUTUALLY_EXCLUSIVE_GROUPS.values():
            hard.update(group)
        hard.update(cls.HIERARCHIES.keys())
        hard.add("is_pan_india")
        return hard

    @classmethod
    def apply_answer_constraints(
        cls,
        q_id: str,
        answer_score: float, # 1.0 (yes), 0.75 (prob), 0.5 (idk), 0.25 (prob_not), 0.0 (no)
        q_map: Dict[str, int],
        asked_mask: np.ndarray,
        log_probs: np.ndarray,
        matrix: np.ndarray,
    ):
        """Propagates logical constraints and prunes impossible candidates strictly."""
        if q_id not in q_map:
            return

        q_idx = q_map[q_id]
        asked_mask[q_idx] = True

        # Treat strong answers (1.0 or 0.0) as definitive constraints
        is_yes = (answer_score >= 0.75)
        is_no = (answer_score <= 0.25)
        is_hard = q_id in cls.get_hard_factual_questions()

        if is_yes and is_hard:
            # 1. Hard candidate elimination: candidates with attribute 0 are IMPOSSIBLE
            col = matrix[:, q_idx]
            impossible_mask = (col == 0.0)
            log_probs[impossible_mask] = -1e6

            # 2. Mutually exclusive group propagation: all other questions in group MUST be NO
            for group_name, members in cls.MUTUALLY_EXCLUSIVE_GROUPS.items():
                if q_id in members:
                    for sibling in members:
                        if sibling != q_id and sibling in q_map:
                            s_idx = q_map[sibling]
                            asked_mask[s_idx] = True
                            # Sibling attribute is 0, so eliminate any candidate having sibling=1
                            sibling_col = matrix[:, s_idx]
                            log_probs[sibling_col == 1.0] = -1e6

            # 3. Major split rules
            if q_id in cls.MAJOR_SPLIT_RULES:
                to_mask = cls.MAJOR_SPLIT_RULES[q_id].get("if_yes_mask", [])
                for target_q in to_mask:
                    if target_q in q_map:
                        asked_mask[q_map[target_q]] = True

            # 4. If era bucket is YES, mask post_2000 / pre_2000 macro questions
            if q_id in ["released_2000s", "released_2010s", "released_post_2020"]:
                if "released_post_2000" in q_map:
                    asked_mask[q_map["released_post_2000"]] = True
                for pre_q in ["released_pre_1970", "released_1970_1989", "released_1990_1999"]:
                    if pre_q in q_map:
                        asked_mask[q_map[pre_q]] = True

            if q_id in ["released_pre_1970", "released_1970_1989", "released_1990_1999"]:
                if "released_post_2000" in q_map:
                    asked_mask[q_map["released_post_2000"]] = True
                for post_q in ["released_2000s", "released_2010s", "released_post_2020"]:
                    if post_q in q_map:
                        asked_mask[q_map[post_q]] = True

            # 5. If South Indian child is YES, mask is_south_indian and Bollywood stars
            if q_id in ["is_telugu", "is_tamil", "is_malayalam", "is_kannada"]:
                if "is_south_indian" in q_map:
                    asked_mask[q_map["is_south_indian"]] = True
                for b_star in cls.BOLLYWOOD_STARS:
                    if b_star in q_map:
                        asked_mask[q_map[b_star]] = True

            # 6. If star actor is YES, mask all other superstar questions
            if q_id in cls.MUTUALLY_EXCLUSIVE_GROUPS["star_actors"]:
                for s_id in cls.MUTUALLY_EXCLUSIVE_GROUPS["star_actors"]:
                    if s_id != q_id and s_id in q_map:
                        asked_mask[q_map[s_id]] = True

        elif is_no and is_hard:
            # 1. Hard candidate elimination: candidates with attribute 1 are IMPOSSIBLE
            col = matrix[:, q_idx]
            impossible_mask = (col == 1.0)
            log_probs[impossible_mask] = -1e6

            # 2. Major split rules
            if q_id in cls.MAJOR_SPLIT_RULES:
                to_mask = cls.MAJOR_SPLIT_RULES[q_id].get("if_no_mask", [])
                for target_q in to_mask:
                    if target_q in q_map:
                        asked_mask[q_map[target_q]] = True

        # Implication rules
        ans_str = "yes" if is_yes else ("no" if is_no else None)
        if ans_str and (q_id, ans_str) in cls.IMPLICATION_RULES:
            for imp_q in cls.IMPLICATION_RULES[(q_id, ans_str)]:
                if imp_q in q_map:
                    asked_mask[q_map[imp_q]] = True
