import random

from core.game_generator import generate_grid
from core.payoff_builder import get_payoff
from core.solver import solve_game
from models.dtos import Role


def initialize_game(n, m):
    grid = generate_grid(n, m)
    payoff = get_payoff(grid)
    results = solve_game(payoff)

    return {
        "grid": grid,
        "payoff_matrix": payoff,
        "hider_strategies": results["hider_strategies"],
        "seeker_strategies": results["seeker_strategies"],
        "expected_value": results["game_value"]
    }

def computer_turn(probs):
    return random.choices(range(len(probs)), weights=probs, k=1)[0]

def run_round(hider_cell, seeker_cell, payoff_matrix):
    points = payoff_matrix[hider_cell][seeker_cell]
    if points > 0:
        return {
            "winner": Role.HIDER,
            "points": points
        }
    else:
        return {
            "winner": Role.SEEKER,
            "points": abs(points)
        }
