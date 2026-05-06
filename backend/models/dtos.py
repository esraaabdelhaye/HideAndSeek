from pydantic import BaseModel
from enum import Enum

class Role(str, Enum):
    HIDER = 'hider'
    SEEKER = 'seeker'

class NewGameRequest(BaseModel):
    n: int
    m: int
    role: Role

class NewGameResponse(BaseModel):
    session_id: str
    grid: list[list[int]]
    payoff_matrix: list[list[float]]
    hider_strategies: list[float]
    seeker_strategies: list[float]
    expected_value: float

class PlayRoundRequest(BaseModel):
    session_id: str
    human_row: int
    human_col: int

class PlayRoundResponse(BaseModel):
    computer_row: int
    computer_col: int
    winner: str # "human" / "computer"
    points: float
    human_score: float
    computer_score: float
    human_round_score: float
    computer_round_score: float
    human_rounds_won: int
    computer_rounds_won: int

class SimulationRequest(BaseModel):
    session_id: str

class RoundSnapshot(BaseModel):
    round: int
    hider_row: int
    hider_col: int
    seeker_row: int
    seeker_col: int
    winner: Role
    points: float

class SimulationResponse(BaseModel):
    hider_rounds_won: int
    seeker_rounds_won: int
    hider_score: float
    seeker_score: float
    snapshots: list[RoundSnapshot]
