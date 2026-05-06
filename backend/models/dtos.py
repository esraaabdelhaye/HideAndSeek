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
    computer_probs: list[float]
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
    human_rounds_won: int
    computer_rounds_won: int
