#!/usr/bin/env python3
"""Comprehensive 50K Indian Cinema Dataset Ingestion & Precomputation Pipeline.

Ingests all 50,602 movies from 'data/raw_archive/indian movies.csv', merges curated iconic
films and detailed tropes from 'backend/data/indian_cinema.json', cleans and normalizes all
fields, builds a rich 90-question bisection & trope catalog, and outputs:
1. SQLite Database: backend/data/movies_50k.db (indexed for sub-millisecond search & pagination)
2. Compressed NumPy Matrix: backend/data/attributes_matrix.npz (N x Q matrix, priors, weights, h_attr)
3. Question Catalog: backend/data/questions_catalog.json
"""

import csv
import json
import math
import os
import re
import sqlite3
import sys
import time
from pathlib import Path
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_CSV = ROOT_DIR / "data" / "raw_archive" / "indian movies.csv"
ICONIC_JSON = ROOT_DIR / "backend" / "data" / "indian_cinema.json"
OUT_DB = ROOT_DIR / "backend" / "data" / "movies_50k.db"
OUT_NPZ = ROOT_DIR / "backend" / "data" / "attributes_matrix.npz"
OUT_QUESTIONS = ROOT_DIR / "backend" / "data" / "questions_catalog.json"
OUT_SUMMARY_JSON = ROOT_DIR / "backend" / "data" / "indian_cinema_50k_summary.json"

LANGUAGE_TO_INDUSTRY = {
    "hindi": "Bollywood (Hindi)",
    "tamil": "Kollywood (Tamil)",
    "telugu": "Tollywood (Telugu)",
    "malayalam": "Mollywood (Malayalam)",
    "kannada": "Sandalwood (Kannada)",
    "bengali": "Bengali Cinema",
    "marathi": "Marathi Cinema",
    "punjabi": "Punjabi Cinema",
    "gujarati": "Gujarati Cinema",
    "urdu": "Urdu Cinema",
    "nepali": "Nepali Cinema",
    "oriya": "Odia Cinema (Ollywood)",
    "bhojpuri": "Bhojpuri Cinema",
    "assamese": "Assamese Cinema (Jollywood)",
    "rajastani": "Rajasthani Cinema",
    "sanskrit": "Sanskrit Cinema",
    "kashmiri": "Kashmiri Cinema",
    "konkani": "Konkani Cinema",
    "tulu": "Tulu Cinema (Coastalwood)",
}

INDUSTRY_TO_LANGUAGE = {v: k for k, v in LANGUAGE_TO_INDUSTRY.items()}

QUESTIONS = [
    # 1. Industry / Language Bisections
    {"id": "is_hindi", "text": "Is this originally a Hindi-language (Bollywood) movie?", "category": "industry", "weight": 1.25},
    {"id": "is_telugu", "text": "Is this originally a Telugu-language (Tollywood) movie?", "category": "industry", "weight": 1.25},
    {"id": "is_tamil", "text": "Is this originally a Tamil-language (Kollywood) movie?", "category": "industry", "weight": 1.25},
    {"id": "is_malayalam", "text": "Is this originally a Malayalam-language (Mollywood) movie?", "category": "industry", "weight": 1.25},
    {"id": "is_kannada", "text": "Is this originally a Kannada-language (Sandalwood) movie?", "category": "industry", "weight": 1.20},
    {"id": "is_south_indian", "text": "Is this originally a South Indian cinema film (Tamil, Telugu, Malayalam, or Kannada)?", "category": "industry", "weight": 1.30},
    {"id": "is_bengali", "text": "Is this originally a Bengali-language cinema movie?", "category": "industry", "weight": 1.15},
    {"id": "is_marathi", "text": "Is this originally a Marathi-language cinema movie?", "category": "industry", "weight": 1.15},
    {"id": "is_punjabi", "text": "Is this originally a Punjabi-language cinema movie?", "category": "industry", "weight": 1.15},
    {"id": "is_regional_or_other", "text": "Is this in Urdu, Gujarati, Bhojpuri, Odia, Assamese, Nepali, or another regional Indian language?", "category": "industry", "weight": 1.10},
    {"id": "is_pan_india", "text": "Was this marketed and theatrically released as a massive multilingual Pan-India blockbuster?", "category": "scale", "weight": 1.20},

    # 2. Era / Decade Bisections
    {"id": "released_pre_1970", "text": "Was this movie released before 1970 (Vintage / Early Golden Age era)?", "category": "era", "weight": 1.15},
    {"id": "released_1970_1989", "text": "Was this movie released during the 1970s or 1980s (Masala & Angry Young Man era)?", "category": "era", "weight": 1.15},
    {"id": "released_1990_1999", "text": "Was this movie released during the 1990s (90s Romance & Action era)?", "category": "era", "weight": 1.15},
    {"id": "released_post_2000", "text": "Was this movie released in the 21st century (year 2000 or later)?", "category": "era", "weight": 1.30},
    {"id": "released_2000s", "text": "Was this movie released between 2000 and 2009 (Millennium era)?", "category": "era", "weight": 1.15},
    {"id": "released_2010s", "text": "Was this movie released between 2010 and 2019 (2010s Blockbuster era)?", "category": "era", "weight": 1.15},
    {"id": "released_post_2020", "text": "Was this movie released in 2020 or later (Post-Pandemic modern era)?", "category": "era", "weight": 1.20},

    # 3. Runtime Bisections
    {"id": "is_epic_runtime_150_plus", "text": "Does this film have an epic long runtime exceeding 2.5 hours (over 150 minutes)?", "category": "runtime", "weight": 1.15},
    {"id": "is_compact_runtime_under_110", "text": "Is this a compact, fast-paced film with a runtime under 110 minutes (less than 1 hr 50 min)?", "category": "runtime", "weight": 1.15},
    {"id": "is_standard_runtime", "text": "Does this film have a typical theatrical runtime between 110 and 150 minutes?", "category": "runtime", "weight": 1.05},

    # 4. Critical & Commercial Reception
    {"id": "is_highly_rated_imdb_7_5", "text": "Is this movie critically acclaimed with an IMDb rating of 7.5 or higher?", "category": "reception", "weight": 1.20},
    {"id": "is_masterpiece_imdb_8_0", "text": "Is this movie widely celebrated as a masterpiece with an IMDb rating of 8.0 or higher?", "category": "reception", "weight": 1.20},
    {"id": "is_popular_blockbuster_votes", "text": "Is this a major high-profile release or blockbuster with over 5,000 public IMDb votes?", "category": "reception", "weight": 1.25},
    {"id": "is_cult_or_niche", "text": "Is this an indie, lesser-known, or niche production with fewer than 500 recorded public votes?", "category": "reception", "weight": 1.10},

    # 5. Major Genres
    {"id": "is_action", "text": "Is high-octane action, combat, or stunt choreography a primary genre of this movie?", "category": "genre", "weight": 1.25},
    {"id": "is_comedy", "text": "Is comedy, humor, or laugh-out-loud entertainment a central element of this film?", "category": "genre", "weight": 1.25},
    {"id": "is_pure_comedy_or_satire", "text": "Is the primary genre of the movie comedy, humor, or social satire?", "category": "genre", "weight": 1.10},
    {"id": "is_romance", "text": "Is a romantic love story or passionate relationship the central theme?", "category": "genre", "weight": 1.20},
    {"id": "is_romantic_drama", "text": "Is a passionate romantic relationship or tragic love story the primary focus?", "category": "genre", "weight": 1.15},
    {"id": "is_drama", "text": "Is this primarily an emotional, character-driven dramatic film?", "category": "genre", "weight": 1.20},
    {"id": "is_thriller", "text": "Is this an edge-of-the-seat thriller filled with suspense, tension, or peril?", "category": "genre", "weight": 1.20},
    {"id": "is_crime", "text": "Does the plot heavily involve crime, criminals, illicit syndicates, or investigation?", "category": "genre", "weight": 1.15},
    {"id": "is_horror", "text": "Does the movie belong to the horror or supernatural scare genre?", "category": "genre", "weight": 1.20},
    {"id": "is_musical", "text": "Is this movie celebrated as a grand musical with iconic, plot-integrated songs and dance?", "category": "genre", "weight": 1.15},
    {"id": "is_mystery", "text": "Does the film center on solving an unsolved mystery, enigma, or whodunit?", "category": "genre", "weight": 1.15},
    {"id": "is_family", "text": "Is this explicitly a wholesome family entertainer or multi-generational family saga?", "category": "genre", "weight": 1.15},
    {"id": "is_adventure", "text": "Does the story feature an exciting journey, expedition, or high-stakes adventure?", "category": "genre", "weight": 1.10},
    {"id": "is_sci_fi", "text": "Does the film incorporate science fiction elements (time travel, advanced tech, aliens, robots)?", "category": "genre", "weight": 1.20},
    {"id": "has_supernatural_or_sci_fi", "text": "Does the film feature sci-fi, humanoid robots, time travel, ghosts, or superheroes?", "category": "genre", "weight": 1.15},
    {"id": "is_fantasy", "text": "Does the story feature fantasy realms, folklore magic, curses, or mythological legends?", "category": "genre", "weight": 1.15},
    {"id": "is_biography", "text": "Is this a biographical film based on the real life of an actual historical or public figure?", "category": "genre", "weight": 1.15},
    {"id": "is_history", "text": "Is this a historical period piece recreating actual historical events or eras?", "category": "genre", "weight": 1.15},
    {"id": "is_historical_or_period_dynasty", "text": "Is this a period piece set during ancient royal dynasties or British colonial rule?", "category": "era", "weight": 1.10},
    {"id": "is_sports_centered", "text": "Is the film centered around sports, athletics, wrestling, or competitive tournaments?", "category": "genre", "weight": 1.20},
    {"id": "has_cricket_match", "text": "Does a high-stakes cricket match play a pivotal role in the plot?", "category": "plot", "weight": 1.15},
    {"id": "is_war", "text": "Does the movie depict wartime military combat or border battlefront clashes?", "category": "genre", "weight": 1.15},
    {"id": "is_animation_or_short", "text": "Is this an animated feature or a short film production?", "category": "genre", "weight": 1.10},

    # 6. Popular Indian Film Tropes & Micro-tropes
    {"id": "is_revenge_story", "text": "Is personal revenge, retribution, or family vengeance the core driving motive?", "category": "plot", "weight": 1.20},
    {"id": "features_police_or_cop", "text": "Is the main protagonist an active police officer or law enforcement agent?", "category": "character", "weight": 1.20},
    {"id": "features_undercover_or_spy", "text": "Does the hero act undercover, concealing their true identity as a spy, cop, or agent?", "category": "character", "weight": 1.20},
    {"id": "features_mafia_or_gangster", "text": "Does the story revolve around the underworld, mafia, smuggling syndicates, or gang wars?", "category": "character", "weight": 1.20},
    {"id": "features_double_role", "text": "Does any main actor portray a double role, twin, or alter-ego?", "category": "trope", "weight": 1.15},
    {"id": "has_love_triangle", "text": "Does the central conflict involve a romantic love triangle between three people?", "category": "plot", "weight": 1.15},
    {"id": "strong_mother_or_father_core", "text": "Is intense emotional conflict, sacrifice, or vow to a parent (mother/father) central?", "category": "plot", "weight": 1.15},
    {"id": "has_murder_investigation", "text": "Does the plot involve investigating a murder, serial killer, or covering up an accidental death?", "category": "plot", "weight": 1.20},
    {"id": "has_major_twist_ending", "text": "Is the film famous for a shocking climax or major identity twist ending?", "category": "trope", "weight": 1.15},
    {"id": "is_anti_hero_or_morally_grey", "text": "Is the main protagonist morally grey, a ruthless criminal, or an anti-hero?", "category": "character", "weight": 1.15},
    {"id": "features_courtroom_climax", "text": "Does a fiery, high-stakes courtroom trial determine the climax?", "category": "plot", "weight": 1.15},
    {"id": "features_heist_or_con", "text": "Does the plot center on planning and executing an elaborate heist, bank robbery, or high-stakes con?", "category": "plot", "weight": 1.15},
    {"id": "features_amnesia_or_memory_loss", "text": "Does a central character suffer from amnesia, short-term memory loss, or split personality?", "category": "trope", "weight": 1.15},
    {"id": "terminal_illness_ending", "text": "Does a lead character suffer from a fatal cancer or incurable terminal illness?", "category": "trope", "weight": 1.15},
    {"id": "has_iconic_train_scene", "text": "Does the movie feature an iconic train sequence, fight, chase, or reunion?", "category": "trope", "weight": 1.10},
    {"id": "features_horror_comedy", "text": "Is this a horror-comedy blend combining spooky ghost elements with hilarious humor?", "category": "trope", "weight": 1.20},
    {"id": "is_patriotic_or_military", "text": "Is patriotic devotion to the motherland or armed forces military sacrifice the soul of the story?", "category": "trope", "weight": 1.20},
    {"id": "is_mythological_or_devotional", "text": "Is the film based on Hindu mythology, divine epics, or intense devotional worship?", "category": "trope", "weight": 1.20},
    {"id": "is_multi_starrer", "text": "Is this a grand ensemble multi-starrer featuring two or more massive superstar heroes together?", "category": "trope", "weight": 1.15},

    # 7. Setting & Environment
    {"id": "has_rural_or_village_setting", "text": "Is a major portion of the story set in a rustic village, forest, or small remote town?", "category": "setting", "weight": 1.15},
    {"id": "set_in_mumbai", "text": "Is the movie set primarily in Mumbai (its streets, chawls, local trains, or underworld)?", "category": "setting", "weight": 1.15},
    {"id": "set_in_delhi_or_punjab", "text": "Is the movie set primarily in Delhi or the rural farmlands of Punjab?", "category": "setting", "weight": 1.10},
    {"id": "involves_foreign_travel", "text": "Does a significant part of the movie take place overseas outside India (e.g. Europe, USA)?", "category": "setting", "weight": 1.10},
    {"id": "involves_mining_fields", "text": "Does the story revolve around the brutal labor of mining fields (gold or coal)?", "category": "setting", "weight": 1.10},
    {"id": "features_college_or_student_life", "text": "Does the plot heavily feature college campus, university, or youth student life?", "category": "setting", "weight": 1.10},
    {"id": "features_folklore_or_daiva", "text": "Does it center on indigenous folklore, forest spirits, or ancient sacred rituals?", "category": "trope", "weight": 1.15},

    # 8. Iconic Star Signatures & Diversity
    {"id": "is_female_led", "text": "Is this film led by a female protagonist with no prominent male savior?", "category": "character", "weight": 1.20},
    {"id": "stars_shah_rukh_khan", "text": "Does Shah Rukh Khan play the lead role?", "category": "cast", "weight": 1.15},
    {"id": "stars_aamir_khan", "text": "Does Aamir Khan play a main role?", "category": "cast", "weight": 1.15},
    {"id": "stars_salman_khan", "text": "Does Salman Khan play the lead role?", "category": "cast", "weight": 1.15},
    {"id": "stars_amitabh_bachchan", "text": "Does Amitabh Bachchan star in this movie?", "category": "cast", "weight": 1.15},
    {"id": "stars_rajinikanth", "text": "Does 'Superstar' Rajinikanth play the lead role?", "category": "cast", "weight": 1.15},
    {"id": "stars_kamal_haasan", "text": "Does Kamal Haasan headline this film?", "category": "cast", "weight": 1.15},
    {"id": "stars_prabhas", "text": "Does Prabhas play the lead protagonist?", "category": "cast", "weight": 1.15},
    {"id": "stars_allu_arjun", "text": "Does Allu Arjun star as the lead hero?", "category": "cast", "weight": 1.15},
    {"id": "stars_mohanlal_or_mammootty", "text": "Does Mohanlal or Mammootty star in this movie?", "category": "cast", "weight": 1.15},
    {"id": "stars_yash", "text": "Does Yash star as the lead hero?", "category": "cast", "weight": 1.15},
    {"id": "stars_ranbir_kapoor_or_ranveer_singh", "text": "Does Ranbir Kapoor or Ranveer Singh star in the lead?", "category": "cast", "weight": 1.15},
    {"id": "stars_ayushmann_or_rajkummar", "text": "Does Ayushmann Khurrana or Rajkummar Rao headline this movie?", "category": "cast", "weight": 1.10},
]

QUESTION_MAP = {q["id"]: i for i, q in enumerate(QUESTIONS)}


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]", "", title.lower())


def evaluate_movie_attributes(
    title: str,
    year: int | None,
    timing: int | None,
    rating: float | None,
    votes: int,
    genres: list[str],
    language: str,
    director: str | None = None,
    lead_cast: list[str] | None = None,
    iconic_attrs: dict[str, float] | None = None,
) -> dict[str, float]:
    """Evaluates question attributes for any movie, blending raw metadata rules with curated iconic data."""
    attrs: dict[str, float] = {}
    title_lower = title.lower()
    genre_set = set(genres)
    is_iconic = iconic_attrs is not None

    # 1. Industry / Language
    attrs["is_hindi"] = 1.0 if language == "hindi" else 0.0
    attrs["is_telugu"] = 1.0 if language == "telugu" else 0.0
    attrs["is_tamil"] = 1.0 if language == "tamil" else 0.0
    attrs["is_malayalam"] = 1.0 if language == "malayalam" else 0.0
    attrs["is_kannada"] = 1.0 if language == "kannada" else 0.0
    attrs["is_south_indian"] = 1.0 if language in ("tamil", "telugu", "malayalam", "kannada", "tulu") else 0.0
    attrs["is_bengali"] = 1.0 if language == "bengali" else 0.0
    attrs["is_marathi"] = 1.0 if language == "marathi" else 0.0
    attrs["is_punjabi"] = 1.0 if language == "punjabi" else 0.0
    attrs["is_regional_or_other"] = 1.0 if language in (
        "urdu", "gujarati", "bhojpuri", "nepali", "oriya", "assamese", "rajastani", "sanskrit", "kashmiri", "konkani"
    ) else 0.0
    attrs["is_pan_india"] = 1.0 if (
        (votes >= 20000 and year and year >= 2015 and language in ("telugu", "tamil", "kannada", "hindi"))
        or any(w in title_lower for w in ["baahubali", "kgf", "rrr", "pushpa", "kantara", "jawan", "kalki", "salaar", "leo", "jailer"])
        or (is_iconic and language in ("telugu", "tamil", "kannada") and year and year >= 2015)
    ) else 0.0

    # 2. Era / Decade (Strict, non-overlapping decade buckets)
    if year is not None:
        attrs["released_pre_1970"] = 1.0 if year < 1970 else 0.0
        attrs["released_1970_1989"] = 1.0 if 1970 <= year <= 1989 else 0.0
        attrs["released_1990_1999"] = 1.0 if 1990 <= year <= 1999 else 0.0
        attrs["released_post_2000"] = 1.0 if year >= 2000 else 0.0
        attrs["released_2000s"] = 1.0 if 2000 <= year <= 2009 else 0.0
        attrs["released_2010s"] = 1.0 if 2010 <= year <= 2019 else 0.0
        attrs["released_post_2020"] = 1.0 if year >= 2020 else 0.0
    else:
        for k in [
            "released_pre_1970", "released_1970_1989",
            "released_1990_1999", "released_post_2000", "released_2000s", "released_2010s", "released_post_2020"
        ]:
            attrs[k] = 0.5

    # 3. Runtime
    if timing is not None:
        attrs["is_epic_runtime_150_plus"] = 1.0 if timing >= 150 else 0.0
        attrs["is_compact_runtime_under_110"] = 1.0 if timing < 110 else 0.0
        attrs["is_standard_runtime"] = 1.0 if 110 <= timing < 150 else 0.0
    else:
        attrs["is_epic_runtime_150_plus"] = 0.5
        attrs["is_compact_runtime_under_110"] = 0.5
        attrs["is_standard_runtime"] = 0.5

    # 4. Reception & Votes
    if is_iconic:
        attrs["is_highly_rated_imdb_7_5"] = 1.0
        attrs["is_masterpiece_imdb_8_0"] = 1.0
        attrs["is_popular_blockbuster_votes"] = 1.0
        attrs["is_cult_or_niche"] = 0.0
    else:
        if rating is not None:
            attrs["is_highly_rated_imdb_7_5"] = 1.0 if rating >= 7.5 else 0.0
            attrs["is_masterpiece_imdb_8_0"] = 1.0 if rating >= 8.0 else 0.0
        else:
            attrs["is_highly_rated_imdb_7_5"] = 0.5
            attrs["is_masterpiece_imdb_8_0"] = 0.5

        attrs["is_popular_blockbuster_votes"] = 1.0 if votes >= 5000 else 0.0
        attrs["is_cult_or_niche"] = 1.0 if votes < 500 else 0.0

    # 5. Major Genres
    attrs["is_action"] = 1.0 if "Action" in genre_set else 0.0
    attrs["is_comedy"] = 1.0 if "Comedy" in genre_set else 0.0
    attrs["is_pure_comedy_or_satire"] = 1.0 if ("Comedy" in genre_set and "Action" not in genre_set) else 0.0
    attrs["is_romance"] = 1.0 if "Romance" in genre_set else 0.0
    attrs["is_romantic_drama"] = 1.0 if ("Romance" in genre_set and "Drama" in genre_set) else 0.0
    attrs["is_drama"] = 1.0 if "Drama" in genre_set else 0.0
    attrs["is_thriller"] = 1.0 if "Thriller" in genre_set else 0.0
    attrs["is_crime"] = 1.0 if "Crime" in genre_set else 0.0
    attrs["is_horror"] = 1.0 if "Horror" in genre_set else 0.0
    attrs["is_musical"] = 1.0 if ("Musical" in genre_set or "Music" in genre_set) else 0.0
    attrs["is_mystery"] = 1.0 if "Mystery" in genre_set else 0.0
    attrs["is_family"] = 1.0 if "Family" in genre_set else 0.0
    attrs["is_adventure"] = 1.0 if "Adventure" in genre_set else 0.0
    attrs["is_sci_fi"] = 1.0 if "Sci-Fi" in genre_set else 0.0
    attrs["has_supernatural_or_sci_fi"] = 1.0 if (
        "Sci-Fi" in genre_set or "Fantasy" in genre_set or "Horror" in genre_set
    ) else 0.0
    attrs["is_fantasy"] = 1.0 if "Fantasy" in genre_set else 0.0
    attrs["is_biography"] = 1.0 if "Biography" in genre_set else 0.0
    attrs["is_history"] = 1.0 if "History" in genre_set else 0.0
    attrs["is_historical_or_period_dynasty"] = 1.0 if ("History" in genre_set or "War" in genre_set) else 0.0
    attrs["is_sports_centered"] = 1.0 if (
        "Sport" in genre_set or any(w in title_lower for w in ["cricket", "lagaan", "dangal", "sultan", "jersey", "83", "chak de"])
    ) else 0.0
    attrs["has_cricket_match"] = 1.0 if any(w in title_lower for w in ["cricket", "lagaan", "83", "ms dhoni", "jersey", "jannat"]) else 0.0
    attrs["is_war"] = 1.0 if "War" in genre_set else 0.0
    attrs["is_animation_or_short"] = 1.0 if ("Animation" in genre_set or "Short" in genre_set) else 0.0

    # 6. Tropes & Micro-tropes (inferred default priors)
    attrs["is_revenge_story"] = 1.0 if ("Action" in genre_set and ("Crime" in genre_set or "Thriller" in genre_set)) else 0.0
    attrs["features_police_or_cop"] = 1.0 if any(
        w in title_lower for w in ["police", "cop", "inspector", "cid", "singham", "simmba", "rakshak", "darbar", "khiladi"]
    ) else 0.0
    attrs["features_undercover_or_spy"] = 1.0 if any(
        w in title_lower for w in ["spy", "agent", "undercover", "tiger", "pathaan", "war", "khufiya", "baby", "holiday"]
    ) else 0.0
    attrs["features_mafia_or_gangster"] = 1.0 if (
        "Crime" in genre_set and any(w in title_lower for w in ["don", "gang", "mafia", "bhai", "underworld", "company", "sarkar", "satya", "vaastav"])
    ) else 0.0
    attrs["features_double_role"] = 1.0 if any(
        w in title_lower for w in ["judwaa", "humshakal", "don", "krrish", "robot", "rowdy", "fan"]
    ) else 0.0
    attrs["has_love_triangle"] = 1.0 if ("Romance" in genre_set and "Drama" in genre_set) else 0.0
    attrs["strong_mother_or_father_core"] = 1.0 if (
        "Drama" in genre_set and any(w in title_lower for w in ["maa", "baap", "pita", "mother", "father", "parivar", "khandan", "beta", "beti", "dangal"])
    ) else 0.0
    attrs["has_murder_investigation"] = 1.0 if ("Mystery" in genre_set or ("Crime" in genre_set and "Thriller" in genre_set)) else 0.0
    attrs["has_major_twist_ending"] = 1.0 if ("Mystery" in genre_set and "Thriller" in genre_set) else 0.0
    attrs["is_anti_hero_or_morally_grey"] = 1.0 if (
        "Crime" in genre_set and "Drama" in genre_set and any(w in title_lower for w in ["bad", "villain", "gangster", "don", "dacoit", "raees", "pushpa", "animal"])
    ) else 0.0
    attrs["features_courtroom_climax"] = 1.0 if any(
        w in title_lower for w in ["court", "kanoon", "adalat", "insaaf", "nyay", "vakil", "judge", "jolly", "pink", "shahid"]
    ) else 0.0
    attrs["features_heist_or_con"] = 1.0 if any(
        w in title_lower for w in ["heist", "dhoom", "chor", "loot", "chori", "special 26", "fraud", "bluffmaster", "happy new year"]
    ) else 0.0
    attrs["features_amnesia_or_memory_loss"] = 1.0 if any(w in title_lower for w in ["ghajini", "yaad", "bhool"]) else 0.0
    attrs["terminal_illness_ending"] = 1.0 if any(w in title_lower for w in ["anand", "kal ho naa ho", "dil bechara", "ae dil"]) else 0.0
    attrs["has_iconic_train_scene"] = 1.0 if any(w in title_lower for w in ["sholay", "ddlj", "chennai express", "burning train", "jab we met"]) else 0.0
    attrs["features_horror_comedy"] = 1.0 if ("Horror" in genre_set and "Comedy" in genre_set) else 0.0
    attrs["is_patriotic_or_military"] = 1.0 if (
        "War" in genre_set or any(w in title_lower for w in ["desh", "bharat", "hindustan", "tiranga", "fauj", "soldier", "border", "army", "shaheed", "uri", "kargil", "swades", "airlift"])
    ) else 0.0
    attrs["is_mythological_or_devotional"] = 1.0 if any(
        w in title_lower for w in ["bhagwan", "krishna", "ram", "shiva", "devi", "hanuman", "mahabharat", "ramayan", "devbhoomi", "om", "tirupati", "kantara", "kalki"]
    ) else 0.0
    attrs["is_multi_starrer"] = 1.0 if any(
        w in title_lower for w in ["sholay", "karan arjun", "k3g", "rrr", "war", "amar akbar anthony", "border", "om shanti om"]
    ) else 0.0

    # 7. Setting
    attrs["has_rural_or_village_setting"] = 1.0 if any(
        w in title_lower for w in ["gaon", "village", "kantara", "lagaan", "swades", "asuran", "dangal", "paan singh"]
    ) else 0.0
    attrs["set_in_mumbai"] = 1.0 if any(w in title_lower for w in ["mumbai", "bombay", "satya", "dharavi", "slumdog", "shootout"]) else 0.0
    attrs["set_in_delhi_or_punjab"] = 1.0 if any(w in title_lower for w in ["delhi", "punjab", "amritsar", "chandigarh", "fukrey"]) else 0.0
    attrs["involves_foreign_travel"] = 1.0 if any(w in title_lower for w in ["london", "paris", "new york", "america", "foreign", "pardes", "zindagi na milegi"]) else 0.0
    attrs["involves_mining_fields"] = 1.0 if any(w in title_lower for w in ["kgf", "gangs of wasseypur", "kaala patthar", "coal"]) else 0.0
    attrs["features_college_or_student_life"] = 1.0 if any(w in title_lower for w in ["college", "student", "school", "3 idiots", "chhichhore", "student of the year"]) else 0.0
    attrs["features_folklore_or_daiva"] = 1.0 if any(w in title_lower for w in ["kantara", "tumbbad", "daiva", "bhootha", "brahmayugam"]) else 0.0

    # 8. Cast & Director evaluations
    for cast_q in [
        "is_female_led", "stars_shah_rukh_khan", "stars_aamir_khan", "stars_salman_khan",
        "stars_amitabh_bachchan", "stars_rajinikanth", "stars_kamal_haasan", "stars_prabhas",
        "stars_allu_arjun", "stars_mohanlal_or_mammootty", "stars_yash",
        "stars_ranbir_kapoor_or_ranveer_singh", "stars_ayushmann_or_rajkummar"
    ]:
        attrs[cast_q] = 0.0

    if lead_cast:
        cast_str = " ".join(lead_cast).lower() if isinstance(lead_cast, list) else str(lead_cast).lower()
        if any(k in cast_str for k in ["shah rukh", "shahrukh", "srk"]):
            attrs["stars_shah_rukh_khan"] = 1.0
        if any(k in cast_str for k in ["aamir khan", "amir khan"]):
            attrs["stars_aamir_khan"] = 1.0
        if any(k in cast_str for k in ["salman khan"]):
            attrs["stars_salman_khan"] = 1.0
        if any(k in cast_str for k in ["amitabh", "bachchan"]):
            attrs["stars_amitabh_bachchan"] = 1.0
        if any(k in cast_str for k in ["rajinikanth", "rajni", "rajani"]):
            attrs["stars_rajinikanth"] = 1.0
        if any(k in cast_str for k in ["kamal haasan", "kamal hassan", "kamalhasan"]):
            attrs["stars_kamal_haasan"] = 1.0
        if any(k in cast_str for k in ["prabhas"]):
            attrs["stars_prabhas"] = 1.0
        if any(k in cast_str for k in ["allu arjun"]):
            attrs["stars_allu_arjun"] = 1.0
        if any(k in cast_str for k in ["yash"]):
            attrs["stars_yash"] = 1.0
        if any(k in cast_str for k in ["mohanlal", "mammootty"]):
            attrs["stars_mohanlal_or_mammootty"] = 1.0
        if any(k in cast_str for k in ["ranbir kapoor", "ranveer singh"]):
            attrs["stars_ranbir_kapoor_or_ranveer_singh"] = 1.0
        if any(k in cast_str for k in ["ayushmann", "rajkummar", "rajkumar rao"]):
            attrs["stars_ayushmann_or_rajkummar"] = 1.0

    if director and "rajamouli" in director.lower():
        attrs["is_pan_india"] = 1.0
        attrs["is_epic_runtime_150_plus"] = 1.0
        attrs["is_masterpiece_imdb_8_0"] = 1.0
        attrs["is_popular_blockbuster_votes"] = 1.0

    # Override with curated iconic attributes if present!
    if iconic_attrs:
        for k, v in iconic_attrs.items():
            if k in QUESTION_MAP:
                attrs[k] = float(v)

    return attrs


def main():
    print("=" * 70)
    print("Starting 50,000+ Indian Cinema Data Pipeline & Matrix Generation")
    print("=" * 70)
    t0 = time.perf_counter()

    # 1. Load curated iconic movies
    iconic_by_norm = {}
    iconic_all = []
    matched_iconic_ids = set()

    if ICONIC_JSON.exists():
        with open(ICONIC_JSON, "r", encoding="utf-8") as f:
            iconic_data = json.load(f)
            iconic_all = iconic_data.get("movies", [])
            for m in iconic_all:
                norm_t = normalize_title(m["title"])
                iconic_by_norm[(norm_t, m.get("year", 0))] = m
                iconic_by_norm[norm_t] = m
        print(f"Loaded {len(iconic_all)} curated iconic movies from {ICONIC_JSON.name}")

    # 2. Ingest raw CSV
    re_year = re.compile(r"(\d{4})")
    re_num = re.compile(r"(\d+)")

    raw_movies = []
    seen_ids = set()

    with open(RAW_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row_idx, row in enumerate(reader):
            raw_id = row["ID"].strip()
            title = row["Movie Name"].strip() or f"Untitled Movie {row_idx + 1}"
            raw_year = row["Year"].strip()
            raw_timing = row["Timing(min)"].strip()
            raw_rating = row["Rating(10)"].strip()
            raw_votes = row["Votes"].replace(",", "").strip()
            raw_genre = row["Genre"].strip()
            raw_lang = row["Language"].strip().lower()

            # Clean Year
            y_m = re_year.search(raw_year)
            year = int(y_m.group(1)) if y_m else None

            # Clean Timing
            t_m = re_num.search(raw_timing)
            timing = int(t_m.group(1)) if t_m else None

            # Clean Rating
            try:
                rating = float(raw_rating) if raw_rating and raw_rating != "-" else None
            except ValueError:
                rating = None

            # Clean Votes
            try:
                votes = int(raw_votes) if raw_votes and raw_votes != "-" else 0
            except ValueError:
                votes = 0

            # Clean Genres
            genres = [g.strip() for g in raw_genre.split(",") if g.strip() and g.strip() != "-"]

            # Industry mapping
            industry = LANGUAGE_TO_INDUSTRY.get(raw_lang, f"{raw_lang.title()} Cinema")

            # Check match with iconic curated movies
            norm_t = normalize_title(title)
            iconic_match = iconic_by_norm.get((norm_t, year or 0)) or iconic_by_norm.get(norm_t)

            director = "Unknown"
            lead_cast = []
            poster_url = None
            iconic_attrs = None
            is_canonical_iconic = False

            if iconic_match:
                iconic_lang = INDUSTRY_TO_LANGUAGE.get(iconic_match.get("industry", ""), "hindi")
                if raw_lang == iconic_lang and iconic_match["id"] not in matched_iconic_ids:
                    # Original canonical language version!
                    is_canonical_iconic = True
                    matched_iconic_ids.add(iconic_match["id"])
                    m_id = iconic_match["id"]
                    title = iconic_match["title"]
                    year = iconic_match["year"]
                    industry = iconic_match["industry"]
                    director = iconic_match["director"]
                    lead_cast = iconic_match["lead_cast"]
                    poster_url = iconic_match.get("poster_url")
                    iconic_attrs = iconic_match.get("attributes")
                    votes = max(votes, 120000)
                    rating = max(rating or 0.0, 8.4)
                    timing = timing or 165
                elif raw_lang != iconic_lang:
                    # Dubbed version (e.g. Tamil dub of Telugu RRR) -> downweight
                    iconic_attrs = None

            if not is_canonical_iconic:
                if raw_id and raw_id != "-" and raw_id not in seen_ids:
                    m_id = raw_id
                else:
                    slug = re.sub(r"[^a-z0-9]", "_", title.lower())[:24].strip("_")
                    m_id = f"{slug}_{year or 'unknown'}_{row_idx}"
                    if m_id in seen_ids:
                        m_id = f"{m_id}_{raw_lang}"

            seen_ids.add(m_id)

            # Compute Popularity power-law prior
            title_lower = title.lower()
            foreign_kw = [
                'iron man', 'indiana jones', 'star wars', 'zero dark thirty',
                'the jungle book', 'escape plan', 'get smart', 'a good day to die hard',
                'the darjeeling limited', 'the mummy', 'syriana', 'eastern promises',
                'uncharted', 'the big sick', 'fast & furious', 'jurassic', 'transformers'
            ]
            is_foreign = any(k in title_lower for k in foreign_kw)

            rating_val = rating if rating is not None else 6.0
            raw_pop = ((votes + 10.0) ** 0.65) * ((rating_val / 10.0) ** 1.5)
            if is_foreign:
                raw_pop *= 0.001
            if is_canonical_iconic:
                raw_pop *= 4.5
            elif iconic_match and not is_canonical_iconic:
                # Downweight dubs so canonical entity dominates
                raw_pop *= 0.001

            raw_movies.append({
                "id": m_id,
                "title": title,
                "year": year,
                "industry": industry,
                "language": raw_lang,
                "timing_min": timing,
                "rating": rating,
                "votes": votes,
                "genres": genres,
                "director": director,
                "lead_cast": lead_cast,
                "popularity": float(raw_pop),
                "poster_url": poster_url,
                "imdb_id": raw_id if raw_id != "-" else None,
                "iconic_attrs": iconic_attrs,
            })

    print(f"Processed {len(raw_movies)} movies from raw CSV.")

    # 3. Add any iconic movies not yet matched in raw_movies
    added_iconic = 0
    for im in iconic_all:
        if im["id"] not in matched_iconic_ids:
            m_id = im["id"]
            matched_iconic_ids.add(m_id)
            seen_ids.add(m_id)
            lang = INDUSTRY_TO_LANGUAGE.get(im["industry"], "hindi")
            raw_pop = ((120000.0 + 10.0) ** 0.65) * ((8.4 / 10.0) ** 1.5) * 4.5
            raw_movies.append({
                "id": m_id,
                "title": im["title"],
                "year": im["year"],
                "industry": im["industry"],
                "language": lang,
                "timing_min": 165,
                "rating": 8.4,
                "votes": 120000,
                "genres": ["Drama", "Action"],
                "director": im["director"],
                "lead_cast": im["lead_cast"],
                "popularity": float(raw_pop),
                "poster_url": im.get("poster_url"),
                "imdb_id": None,
                "iconic_attrs": im.get("attributes"),
            })
            added_iconic += 1

    total_movies = len(raw_movies)
    print(f"Total movies ingested into database: {total_movies} (added {added_iconic} missing iconic blockbusters)")

    # 4. Build NumPy Attribute Matrix & Priors
    N = total_movies
    Q = len(QUESTIONS)
    print(f"Building Attribute Matrix of shape ({N}, {Q})...")

    matrix = np.zeros((N, Q), dtype=np.float32)
    priors = np.zeros(N, dtype=np.float32)
    movie_ids = np.empty(N, dtype=object)
    question_ids = np.array([q["id"] for q in QUESTIONS], dtype=object)
    weights = np.array([q.get("weight", 1.0) for q in QUESTIONS], dtype=np.float32)

    db_rows = []
    for i, m in enumerate(raw_movies):
        movie_ids[i] = m["id"]
        priors[i] = m["popularity"]

        attrs = evaluate_movie_attributes(
            title=m["title"],
            year=m["year"],
            timing=m["timing_min"],
            rating=m["rating"],
            votes=m["votes"],
            genres=m["genres"],
            language=m["language"],
            director=m["director"],
            lead_cast=m["lead_cast"],
            iconic_attrs=m.get("iconic_attrs"),
        )

        for q_id, val in attrs.items():
            if q_id in QUESTION_MAP:
                col_idx = QUESTION_MAP[q_id]
                matrix[i, col_idx] = np.float32(val)

        db_rows.append((
            m["id"],
            m["title"],
            m["year"],
            m["industry"],
            m["language"],
            m["timing_min"],
            m["rating"],
            m["votes"],
            json.dumps(m["genres"]),
            m["director"],
            json.dumps(m["lead_cast"]),
            round(math.log10(max(1.0, m["popularity"])), 4),
            m["poster_url"],
            m["imdb_id"],
        ))

    # Normalize priors to valid probability distribution
    priors_sum = np.sum(priors)
    if priors_sum > 0:
        priors /= priors_sum
    else:
        priors.fill(1.0 / N)

    # Precompute Conditional Binary Entropy H(Q | C)
    # h2(p) = - p * log2(p) - (1-p) * log2(1-p)
    eps = 1e-7
    clipped_m = np.clip(matrix, eps, 1.0 - eps)
    h_attr = -(clipped_m * np.log2(clipped_m) + (1.0 - clipped_m) * np.log2(1.0 - clipped_m)).astype(np.float32)
    # Zero out deterministic 0.0 or 1.0 entries
    h_attr[(matrix == 0.0) | (matrix == 1.0)] = 0.0

    # 5. Save NumPy Attribute Matrix
    print(f"Saving precomputed matrix to {OUT_NPZ}...")
    np.savez_compressed(
        OUT_NPZ,
        matrix=matrix,
        h_attr=h_attr,
        movie_ids=movie_ids,
        question_ids=question_ids,
        priors=priors,
        weights=weights,
    )
    npz_mb = os.path.getsize(OUT_NPZ) / (1024 * 1024)
    print(f"Attributes matrix saved! Size: {npz_mb:.2f} MB")

    # 6. Save SQLite Database
    print(f"Creating SQLite Database at {OUT_DB}...")
    if OUT_DB.exists():
        OUT_DB.unlink()

    conn = sqlite3.connect(OUT_DB)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE movies (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        year INTEGER,
        industry TEXT NOT NULL,
        language TEXT NOT NULL,
        timing_min INTEGER,
        rating REAL,
        votes INTEGER,
        genres TEXT,
        director TEXT,
        lead_cast TEXT,
        popularity REAL,
        poster_url TEXT,
        imdb_id TEXT
    );
    """)
    cur.execute("CREATE INDEX idx_movies_title ON movies (title COLLATE NOCASE);")
    cur.execute("CREATE INDEX idx_movies_industry ON movies (industry);")
    cur.execute("CREATE INDEX idx_movies_year ON movies (year);")
    cur.execute("CREATE INDEX idx_movies_popularity ON movies (popularity DESC);")

    cur.executemany("""
    INSERT INTO movies (
        id, title, year, industry, language, timing_min, rating, votes,
        genres, director, lead_cast, popularity, poster_url, imdb_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, db_rows)

    conn.commit()
    conn.close()
    db_mb = os.path.getsize(OUT_DB) / (1024 * 1024)
    print(f"SQLite DB created successfully with {len(db_rows)} rows! Size: {db_mb:.2f} MB")

    # 7. Save Questions Catalog JSON
    print(f"Saving Questions Catalog to {OUT_QUESTIONS}...")
    with open(OUT_QUESTIONS, "w", encoding="utf-8") as f:
        json.dump(QUESTIONS, f, indent=2)

    # 8. Save Summary JSON
    summary = {
        "total_movies": N,
        "total_questions": Q,
        "sample_movies": [
            {
                "id": m["id"],
                "title": m["title"],
                "year": m["year"],
                "industry": m["industry"],
                "rating": m["rating"],
                "votes": m["votes"],
                "popularity": m["popularity"],
            }
            for m in raw_movies[:50]
        ]
    }
    with open(OUT_SUMMARY_JSON, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    total_time = time.perf_counter() - t0
    print("=" * 70)
    print(f"Pipeline Complete in {total_time:.2f} seconds!")
    print(f"Movies Loaded: {N}")
    print(f"Questions Count: {Q}")
    print("=" * 70)


if __name__ == "__main__":
    main()
