import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.dtos import NewGameRequest, NewGameResponse, Role, PlayRoundRequest, PlayRoundResponse, SimulationResponse, \
    SimulationRequest, RoundSnapshot
from .engine import initialize_game, computer_turn, run_round

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


# @app.get("/")
# async def root():
#     return {"message": "Hello World"}
#
# @app.get("/linear/{size}")
# async def linear(size: int):
#     return initialize_game(1, size)
# @app.get("/grid/{n}/{m}")
# async def grid(n: int, m: int):
#     return initialize_game(n, m)

sessions = {}

@app.post("/new-game")
def new_game(req: NewGameRequest) -> NewGameResponse:
    session_id = str(uuid.uuid4())
    game = initialize_game(req.n, req.m)
    sessions[session_id] = {
        "role": req.role,
        "payoff_matrix": game["payoff_matrix"],
        "m": req.m,
        "hider_probs": game["hider_strategies"],
        "seeker_probs": game["seeker_strategies"],
        "human_score": 0,
        "computer_score": 0,
        "human_rounds_won": 0,
        "computer_rounds_won": 0
    }
    return NewGameResponse(
        session_id=session_id,
        grid=game["grid"],
        payoff_matrix=game["payoff_matrix"],
        hider_strategies=game["hider_strategies"],
        seeker_strategies=game["seeker_strategies"],
        expected_value=game["expected_value"]
    )

@app.post("/play-round")
def play_round(req: PlayRoundRequest) -> PlayRoundResponse:
    session = sessions[req.session_id]

    human_role = session["role"]
    m = session["m"]
    human_cell = m * req.human_row + req.human_col

    computer_probs = session["hider_probs"] if req.role == Role.SEEKER else session["seeker_probs"]
    computer_cell = computer_turn(computer_probs)

    if human_role == Role.SEEKER:
        hider_cell, seeker_cell = computer_cell, human_cell
    else:
        hider_cell, seeker_cell = human_cell, computer_cell

    winner_role, points = run_round(hider_cell, seeker_cell, session["payoff_matrix"])

    if human_role == winner_role:
        winner = "human"
        session["human_rounds_won"] += 1
        session["human_score"] += points
    else:
        winner = "computer"
        session["computer_rounds_won"] += 1
        session["computer_score"] += points

    return PlayRoundResponse(
        computer_row=computer_cell // m,
        computer_col=computer_cell % m,
        winner=winner,
        points=points,
        human_score=session["human_score"],
        computer_score=session["computer_score"],
        human_rounds_won=session["human_rounds_won"],
        computer_rounds_won=session["computer_rounds_won"]
    )

@app.post("/simulate")
def simulate(req: SimulationRequest) -> SimulationResponse:
    session = sessions[req.session_id]
    m = session["m"]
    payoff_matrix = session["payoff_matrix"]
    hider_probs = session["hider_probs"]
    seeker_probs = session["seeker_probs"]

    hider_total_score = 0
    seeker_total_score = 0
    hider_rounds_won = 0
    seeker_rounds_won = 0
    snapshots = []

    for i in range(100):
        hider_cell = computer_turn(hider_probs)
        seeker_cell = computer_turn(seeker_probs)
        winner, points = run_round(hider_cell, seeker_cell, payoff_matrix)

        if winner == Role.HIDER:
            hider_total_score += points
            hider_rounds_won += 1
        else:
            seeker_total_score += points
            seeker_rounds_won += 1

        snapshots.append(RoundSnapshot(
            round=i,
            hider_row=hider_cell // m,
            hider_col=hider_cell % m,
            seeker_row=seeker_cell // m,
            seeker_col=seeker_cell % m,
            winner=winner,
            points=points
        ))

    return SimulationResponse(
        hider_rounds_won=hider_rounds_won,
        seeker_rounds_won=seeker_rounds_won,
        hider_score=hider_total_score,
        seeker_score=seeker_total_score,
        snapshots=snapshots
    )


