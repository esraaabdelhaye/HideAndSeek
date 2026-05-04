import random
from models.game_models import CellType


def generate_grid(n: int, m: int):
    game_grid = [[None for _ in range(m)] for _ in range(n)]

    for i in range(n):
        for j in range(m):
            game_grid[i][j] = random.choice(list(CellType))

    return game_grid