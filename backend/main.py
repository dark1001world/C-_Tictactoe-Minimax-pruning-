from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import os
from contextlib import asynccontextmanager
# Enable CORS for React frontend
class GameState(BaseModel):
    board: list[str]  # 9 elements, each is 'X', 'O', or '_'
    aiSymbol: str
    humanSymbol: str

class MoveResponse(BaseModel):
    move: int
    board: list[str]
    hasWinner: bool
    isFull: bool
    winner: str | None

# Compile C++ code on startup (you'll need to create cpp_engine.cpp)
@asynccontextmanager
async def compile_cpp(app:FastAPI):
    try:
        # Compile the C++ engine
        compile_cmd = [
            "g++", "-std=c++17", "-O2",
            "src/board.cpp", "src/ai.cpp", "src/cpp_engine.cpp",
            "-o", "tictactoe_engine"
        ]
        result = subprocess.run(compile_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Compilation error: {result.stderr}")
    except Exception as e:
        print(f"Startup compilation failed: {e}")
    yield    
app = FastAPI(lifespan=compile_cpp)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/get-ai-move", response_model=MoveResponse)
async def get_ai_move(state: GameState):
    try:
        # Prepare input for C++ engine
        input_data = {
            "board": state.board,
            "aiSymbol": state.aiSymbol,
            "humanSymbol": state.humanSymbol
        }
        
        # Call C++ engine
        result = subprocess.run(
            ["./tictactoe_engine"],
            input=json.dumps(input_data),
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Engine error: {result.stderr}")
        
        # Parse output from C++ engine
        output = json.loads(result.stdout)
        
        return MoveResponse(
            move=output["move"],
            board=output["board"],
            hasWinner=output["hasWinner"],
            isFull=output["isFull"],
            winner=output.get("winner")
        )
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Engine timeout")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid engine output: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    engine_exists = os.path.exists("./tictactoe_engine")
    return {
        "status": "healthy",
        "engine_compiled": engine_exists
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)