#!/usr/bin/env bash
# ==============================================================================
# Movienator: One-Click Launch Script
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================================="
echo "🎬  M O V I E N A T O R  :  I N D I A N   C I N E M A  🎬"
echo "=================================================================="

# Check Python Venv
if [ ! -d "$DIR/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$DIR/venv"
    "$DIR/venv/bin/pip" install -r requirements.txt
fi

MODE="${1:-standalone}"

if [ "$MODE" = "--cli" ]; then
    echo "Launching Interactive Terminal Game..."
    PYTHONPATH=. "$DIR/venv/bin/python" src/cli_game.py
elif [ "$MODE" = "--dev" ]; then
    echo "Starting Backend API on http://localhost:8000..."
    PYTHONPATH=. "$DIR/venv/bin/uvicorn" backend.app:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!

    echo "Starting Vite Frontend on http://localhost:5173..."
    cd "$DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
else
    # Standalone mode: Build frontend if not present, then launch unified server
    if [ ! -d "$DIR/frontend/dist" ]; then
        echo "Building React frontend..."
        cd "$DIR/frontend" && npm run build && cd "$DIR"
    fi

    echo ""
    echo "✨ Launching Unified Movienator Web App on http://localhost:8000"
    echo "👉 Open http://localhost:8000 in your browser to play!"
    echo "Press Ctrl+C to stop."
    echo ""
    PYTHONPATH=. "$DIR/venv/bin/uvicorn" backend.app:app --host 0.0.0.0 --port 8000
fi
