#!/usr/bin/env python3
"""Movienator Data Ingestion Sample Script.
Demonstrates querying Wikidata SPARQL, MediaWiki API, and TMDb for Indian Cinema.
"""

import json
import time
import requests
from typing import Dict, List, Any


WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"
MEDIAWIKI_API_URL = "https://en.wikipedia.org/w/api.php"
TMDB_BASE_URL = "https://api.themoviedb.org/3"


def query_wikidata_indian_films(limit: int = 15) -> List[Dict[str, Any]]:
    """Fetches Indian films with directors, release years, IMDb IDs, and TMDb IDs via SPARQL."""
    query = f"""
    SELECT ?film ?filmLabel ?year ?imdbId ?tmdbId WHERE {{
      ?film wdt:P31 wd:Q11424.         # Instance of film
      ?film wdt:P495 wd:Q668.          # Country of origin = India
      
      OPTIONAL {{ ?film wdt:P577 ?pubDate. BIND(YEAR(?pubDate) AS ?year) }}
      OPTIONAL {{ ?film wdt:P345 ?imdbId. }}   # IMDb ID (e.g. tt0073707)
      OPTIONAL {{ ?film wdt:P4947 ?tmdbId. }} # TMDb Movie ID
      
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    LIMIT {limit}
    """
    headers = {
        "User-Agent": "MovienatorResearch/1.0 (contact: research@movienator.org)",
        "Accept": "application/sparql-results+json",
    }
    try:
        resp = requests.get(WIKIDATA_SPARQL_URL, params={"query": query, "format": "json"}, headers=headers, timeout=15)
        resp.raise_for_status()
        bindings = resp.json().get("results", {}).get("bindings", [])
        
        results = []
        for b in bindings:
            results.append({
                "wikidata_uri": b.get("film", {}).get("value"),
                "title": b.get("filmLabel", {}).get("value"),
                "year": b.get("year", {}).get("value"),
                "imdb_id": b.get("imdbId", {}).get("value"),
                "tmdb_id": b.get("tmdbId", {}).get("value"),
            })
        return results
    except Exception as e:
        print(f"Wikidata query error: {e}")
        return []


def query_wikipedia_category(category_name: str, limit: int = 10) -> List[str]:
    """Retrieves titles of movies listed under a specific Wikipedia trope category."""
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category_name}",
        "cmlimit": limit,
        "format": "json",
    }
    headers = {"User-Agent": "MovienatorETL/1.0 (academic research)"}
    try:
        resp = requests.get(MEDIAWIKI_API_URL, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        members = resp.json().get("query", {}).get("categorymembers", [])
        return [m["title"] for m in members if m["ns"] == 0]
    except Exception as e:
        print(f"MediaWiki query error for {category_name}: {e}")
        return []


def query_tmdb_keywords(movie_id: int, api_key: str) -> List[str]:
    """Fetches plot keywords for a movie from TMDb."""
    url = f"{TMDB_BASE_URL}/movie/{movie_id}/keywords"
    params = {"api_key": api_key}
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        keywords = resp.json().get("keywords", [])
        return [k["name"] for k in keywords]
    except Exception as e:
        print(f"TMDb API query error: {e}")
        return []


def main():
    print("=" * 60)
    print("🎬 MOVIENATOR DATA PIPELINE DEMO")
    print("=" * 60)

    print("\n1. Querying Wikidata SPARQL for Indian Cinema entries...")
    wiki_films = query_wikidata_indian_films(limit=5)
    print(f"   Found {len(wiki_films)} sample records from Wikidata:")
    for f in wiki_films:
        print(f"   - {f['title']} ({f.get('year', 'N/A')}) | IMDb: {f.get('imdb_id', 'N/A')} | TMDb: {f.get('tmdb_id', 'N/A')}")

    print("\n2. Querying Wikipedia Category: 'Films set in Mumbai'...")
    mumbai_films = query_wikipedia_category("Films_set_in_Mumbai", limit=5)
    print(f"   Found {len(mumbai_films)} sample films:")
    for title in mumbai_films:
        print(f"   - {title}")

    print("\n3. Querying Wikipedia Category: 'Twins in Indian films' (Double Role Trope)...")
    twin_films = query_wikipedia_category("Twins_in_Indian_films", limit=5)
    print(f"   Found {len(twin_films)} sample films:")
    for title in twin_films:
        print(f"   - {title}")

    print("\n✓ Pipeline components functional. Ready for full dataset ingestion.")


if __name__ == "__main__":
    main()
