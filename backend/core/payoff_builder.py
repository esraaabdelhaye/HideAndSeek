from models.game_models import CellType
from models.game_models import SCORING_RULES

def get_payoff(game_matrix):
    rows = len(game_matrix)
    cols = len(game_matrix[0])
    payoff_sz = rows * cols
    payoff = [[0 for i in range(payoff_sz)] for j in range(payoff_sz)]

    # loop over all game cells
    for h_row in range(rows):
        for h_col in range(cols):
            payoff_idx = h_row * cols + h_col
            current_cell_diff = game_matrix[h_row][h_col]
            winning_score = SCORING_RULES[current_cell_diff]["win"]
            losing_score = SCORING_RULES[current_cell_diff]["lose"]
            payoff[payoff_idx] = set_payoff_row(rows, cols, winning_score, h_row, h_col)
            payoff[payoff_idx][payoff_idx] = losing_score

    return payoff

def set_payoff_row(rows, cols, winning_score, h_row, h_col):
    payoff_row_sz = rows * cols
    payoff_row = [0 for i in range(payoff_row_sz)]

    # here we need to loop over all game cells to see how distant they are to the hider
    # and based on the distance we will set the hider's score if the seeker is at this cell
    for s_row in range(rows):
        for s_col in range(cols):
            seeker_idx = s_row * cols + s_col
            factor = 1
            if get_distance(h_row, h_col, s_row, s_col) == 1:
                factor = 0.5
            elif get_distance(h_row, h_col, s_row, s_col) == 2:
                factor = 0.75
            payoff_row[seeker_idx] = factor*winning_score

    return payoff_row



def get_distance(h_row, h_col, s_row, s_col):
    return max(abs(h_row - s_row), abs(h_col - s_col))