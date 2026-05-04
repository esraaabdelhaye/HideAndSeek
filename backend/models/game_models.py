from enum import Enum

class CellType(Enum):
    HARD = 3
    NEUTRAL = 2
    EASY = 1

SCORING_RULES = {
    CellType.EASY:    {"win": 10, "lose": -5},
    CellType.NEUTRAL: {"win": 15, "lose": -10},
    CellType.HARD:    {"win": 20, "lose": -15}
}