import numpy as np
from scipy.optimize import linprog


def solve_game(payoff_matrix):
    A = np.array(payoff_matrix)
    # rows_count = number of Hider strategies
    # cols_count = number of Seeker strategies
    rows_count, cols_count = A.shape
    # normalize the payoff matrix
    # This doesn't change the optimal strategy, only the game value
    # A fundamental rule in Game Theory is that adding a constant to every entry in a payoff matrix does not change the optimal strategies.
    shift = abs(np.min(A)) + 1
    A_positive = A + shift

    # HIDER STRATEGY  (Maximization)
    c_hider = -np.ones(rows_count)
    A_ub_hider = A_positive
    b_ub_hider = np.ones(cols_count)  # One constraint for every Seeker strategy
    res_hider = linprog(c_hider, A_ub=A_ub_hider, b_ub=b_ub_hider, method='highs')
    hider_probs = res_hider.x / np.sum(res_hider.x)

    # SEEKER STRATEGY (Minimization)
    c_seeker = np.ones(cols_count)
    A_ub = -A_positive.T   # coefficients matrix
    b_ub = -np.ones(rows_count)  # One constraint for every Hider strategy
    res_seeker = linprog(c_seeker, A_ub=A_ub, b_ub=b_ub, method='highs')
    seeker_probs = res_seeker.x / np.sum(res_seeker.x)

    return {
        "hider_strategies": hider_probs.tolist(),
        "seeker_strategies": seeker_probs.tolist(),
        "game_value": (1 / np.sum(res_seeker.x)) - shift
    }