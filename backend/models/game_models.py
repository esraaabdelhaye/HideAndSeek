from enum import Enum

class CellType(Enum):
    HARD = 3
    NEUTRAL = 2
    EASY = 1

SCORING_RULES = {
    CellType.EASY:    {"win": 2, "lose": -1},
    CellType.NEUTRAL: {"win": 1, "lose": -1},
    CellType.HARD:    {"win": 1, "lose": -3}
}