from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .engine import initialize_game

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/linear/{size}")
async def linear(size: int):
    return initialize_game(1, size)
@app.get("/grid/{n}/{m}")
async def grid(n: int, m: int):
    return initialize_game(n, m)