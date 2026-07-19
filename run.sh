#!/bin/bash
echo "Starting The VC Brain..."

echo "Cleaning up any old processes..."
kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:8000) 2>/dev/null

echo "Starting backend (FastAPI) on port 8000..."
(cd backend && source ../.venv/bin/activate && python -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting frontend (Next.js) on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Everything is running! (Press Ctrl+C to stop)"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:8000/docs"
echo ""

# Wait until user hits Ctrl+C, then kill both processes
trap "echo 'Stopping...'; kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
