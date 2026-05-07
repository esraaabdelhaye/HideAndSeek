# 🙈 Hide & Seek — Game Theory Engine

A zero-sum game built with **Linear Programming**, **FastAPI**, and **Angular**. Two players — a Hider and a Seeker — compete on a randomized grid. The optimal mixed strategies for both players are computed via the **Minimax Theorem** using a HiGHS LP solver.

---

## 📐 How It Works

### The Game
- The grid is an `n × m` board where each cell is randomly assigned a type: **Easy**, **Neutral**, or **Hard**
- Each round, the Hider picks a cell to hide in and the Seeker picks a cell to search
- If they land on the same cell → **Seeker wins** and scores points
- If they don't → **Hider wins** and scores points
- Points depend on the cell type and the **Chebyshev distance** between the two players

### Payoff Rules

| Cell Type | Hider Wins | Seeker Wins |
|-----------|-----------|------------|
| Easy      | +2        | -1         |
| Neutral   | +1        | -1         |
| Hard      | +1        | -3         |

### Distance Factors
The closer the Seeker is to the Hider, the less the Hider scores even on a miss:

| Chebyshev Distance | Factor |
|--------------------|--------|
| 0 (same cell)      | lose score applied |
| 1 (adjacent)       | × 0.5  |
| 2 (two steps)      | × 0.75 |
| > 2                | × 1.0  |

### Optimal Strategies
The backend solves for the **Nash Equilibrium** using Linear Programming:
- **Hider** maximizes their minimum guaranteed payoff
- **Seeker** minimizes their maximum loss
- Both strategies are returned as probability distributions over all cells
- The **game value V\*** is the expected payoff per round at equilibrium

---

## 🗂️ Project Structure

```
project/
├── backend/
│   ├── core/
│   │   ├── controller.py       # FastAPI routes
│   │   ├── engine.py           # Game orchestration
│   │   ├── game_generator.py   # Random grid generation
│   │   ├── payoff_builder.py   # Payoff matrix construction
│   │   └── solver.py           # LP solver (HiGHS via SciPy)
│   └── models/
│       ├── dtos.py             # Pydantic request/response models
│       └── game_models.py      # CellType enum & scoring rules
└── front/
    └── src/app/
        ├── home-page/          # Landing page & mode selector
        ├── hider/              # Play as Hider component
        ├── seeker/             # Play as Seeker component
        ├── simulation/         # 100-round auto simulation
        └── services/
            └── http.ts         # Angular HTTP service
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install fastapi uvicorn scipy numpy
uvicorn core.controller:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

```bash
cd front
npm install
ng serve
```

The app will be available at `http://localhost:4200`.

---

## 🔌 API Reference

### `POST /new-game`
Creates a new game session with a randomly generated grid and solved LP strategies.

**Request**
```json
{
  "n": 3,
  "m": 3,
  "role": "hider"
}
```

**Response**
```json
{
  "session_id": "uuid",
  "grid": [[1, 2, 3], ...],
  "payoff_matrix": [[...], ...],
  "hider_strategies": [0.12, 0.33, ...],
  "seeker_strategies": [0.08, 0.41, ...],
  "expected_value": 0.5537
}
```

---

### `POST /play-round`
Resolves one round given the human player's chosen cell.

**Request**
```json
{
  "session_id": "uuid",
  "human_row": 1,
  "human_col": 2
}
```

**Response**
```json
{
  "computer_row": 0,
  "computer_col": 1,
  "winner": "human",
  "points": 1.5,
  "human_score": 4.5,
  "computer_score": 2.0,
  "human_rounds_won": 3,
  "computer_rounds_won": 1
}
```

---

### `POST /simulate`
Runs 100 fully automated rounds using the optimal strategies for both players.

**Request**
```json
{
  "session_id": "uuid"
}
```

**Response**
```json
{
  "hider_rounds_won": 82,
  "seeker_rounds_won": 18,
  "hider_score": 91.25,
  "seeker_score": 43.0,
  "snapshots": [
    {
      "round": 0,
      "hider_row": 1, "hider_col": 1,
      "seeker_row": 0, "seeker_col": 2,
      "winner": "hider",
      "points": 1.5
    }
  ]
}
```

---

## 🎮 Game Modes

| Mode | Description |
|------|-------------|
| **Simulation** | Fully automated — both players use optimal LP strategies for 100 rounds |
| **Play as Hider** | You choose where to hide; the Seeker hunts using its optimal strategy |
| **Play as Seeker** | You choose where to search; the Hider hides using its optimal strategy |

---

## 🧠 Theory Notes

- The game is a **finite two-player zero-sum game** — von Neumann's Minimax Theorem guarantees a Nash equilibrium in mixed strategies
- A **constant shift** (`|min(A)| + 1`) is applied to the payoff matrix before solving to ensure all entries are strictly positive, which avoids LP degeneracy without changing the optimal strategies
- The game value V\* is recovered after solving by reversing the shift: `V* = (1 / sum(q*)) - shift`
- Over many rounds, the average payoff per round converges to V\* by the Law of Large Numbers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SciPy (HiGHS), NumPy |
| Frontend | Angular 18+, TypeScript|
| LP Solver | HiGHS via `scipy.optimize.linprog` |
| Sessions | In-memory dict keyed by UUID |
