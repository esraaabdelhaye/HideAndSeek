import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { NewGameResponse, Http, PlayRoundResponse } from '../services/http';

@Component({
  selector: 'app-hider',
  imports: [],
  templateUrl: './hider.html',
  styleUrl: './hider.css',
})
export class Hider implements OnInit {
  @Input() worldLength!: number;
  @Input() worldWidth!: number;
  http = inject(Http);


  ngOnInit(): void {
    this.play();
  }
  play = () => {
    this.http.generateWorld(this.worldLength, this.worldWidth, 'hider').subscribe({
      next: (response) => {
        console.log(response);
        this.response.set(response);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  response = signal<NewGameResponse | null>(null);
  gameState = computed(() => {
    if (!this.response()) return null;
    const state: GameState = [];
    let c = 0
    for (let i = 0; i < (this.response()?.grid.length || 0); i++) {
      const row: choice[] = [];
      for (let j = 0; j < (this.response()?.grid[i].length || 0); j++) {
        const payoffVal = this.response()!.payoff_matrix?.[i]?.[j] ?? this.response()!.payoff_matrix?.flat()[c] ?? 0;
        row.push({
          difficulty: this.response()!.grid[i][j],
          hider_strategy: this.response()!.hider_strategies[c],
          seeker_strategy: this.response()!.seeker_strategies[c],
          row: i,
          col: j,
          payoff_if_hider_wins: payoffVal,
          payoff_if_seeker_wins: -payoffVal
        });
        c++;
      }
      state.push(row);
    }

    return state;
  });
  debug = () => {
    console.log(this.gameState());
    console.log(this.response());

  }

  choose(choice: choice) {
    this.http.playRound(choice.col, choice.row, this.response()?.session_id || '').subscribe({
      next: (response) => {
        console.log('Round result:', response);
        // Here you can implement logic to update the UI based on the round result
        console.log(`Chosen cell: (${choice.row}, ${choice.col}) with difficulty ${choice.difficulty}`);
        const selectedCell = this.gameState()?.flatMap((row) => row).find(c => c.row === response.computer_row && c.col === response.computer_col);
        if (selectedCell !== undefined) {
          console.log(`Selected cell (hider location): (${selectedCell.row}, ${selectedCell.col})`);
          this.algorithmSelectedCell.set({ row: selectedCell.row, col: selectedCell.col });

          if (response.winner === 'computer') {
            console.log("Chosen cell was where hider is!");
            this.animatedCell.set({ row: choice.row, col: choice.col, type: 'collision' });
            this.handleCollision(response);
          } else {
            console.log("Chosen cell was NOT where hider is.");
            this.animatedCell.set({ row: choice.row, col: choice.col, type: 'miss' });
            this.handleMiss(response);
          }
          setTimeout(() => this.animatedCell.set(null), 700);
        }
      },
      error: (error) => {
        console.error('Error playing round:', error);
      }
    });

  }

  handleCollision(res: PlayRoundResponse) {
    this.humanScore.set(res.human_score);
    this.computerScore.set(res.computer_score);
    this.roundGain.set(res.human_round_score);
    this.roundsWon.set(res.human_rounds_won);
    this.roundsLost.set(res.computer_rounds_won);
  }

  handleMiss(res: PlayRoundResponse) {
    this.humanScore.set(res.human_score);
    this.computerScore.set(res.computer_score);
    this.roundGain.set(res.human_round_score);
    this.roundsWon.set(res.human_rounds_won);
    this.roundsLost.set(res.computer_rounds_won);
  }
  humanScore = signal(0);
  computerScore = signal(0);
  roundGain = signal(0);
  roundsWon = signal(0);
  roundsLost = signal(0);
  accumulator = signal(0);
  animatedCell = signal<{ row: number; col: number; type: 'collision' | 'miss' } | null>(null);
  algorithmSelectedCell = signal<{ row: number; col: number } | null>(null);
}

/* 
export interface HideAndSeekResponse {
  grid: number[][];
  payoff_matrix: number[][];
  hider_strategies: number[];
  seeker_strategies: number[];
  expected_value: number;
}

*/
export interface choice {
  difficulty: number;
  hider_strategy: number;
  seeker_strategy: number;
  row: number;
  col: number;
  payoff_if_hider_wins: number;
  payoff_if_seeker_wins: number;
}
type GameState = choice[][]

function weightedRandom(items: choice[], weights: number[]): any {
  // 1. Calculate the total sum of all weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // 2. Generate a random number between 0 and totalWeight
  const randomNum = Math.random() * totalWeight;

  // 3. Iterate through items, subtracting weights from the random number
  let currentWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    currentWeight += weights[i];
    // If the random number is less than the accumulated weight, select this item
    if (randomNum < currentWeight) {
      return items[i];
    }
  }

  // Fallback (should theoretically not be reached if weights are correct)
  return items[items.length - 1];
}


const scores: Record<string, { win: number; lose: number }> = {
  "EASY": { "win": 10, "lose": -5 },
  "NEUTRAL": { "win": 15, "lose": -10 },
  "HARD": { "win": 20, "lose": -15 }
}
