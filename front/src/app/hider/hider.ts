import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { NewGameResponse, Http } from '../services/http';

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
        this.reponse.set(response);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  reponse =signal<NewGameResponse | null> (null);
  gameState = computed(() => {
    if (!this.reponse()) return null;
    const state: GameState = [];
    let c = 0
    for (let i = 0; i < (this.reponse()?.grid.length || 0); i++) {
      const row: choice[] = [];
      for (let j = 0; j < (this.reponse()?.grid[i].length || 0); j++) {
        const payoffVal = this.reponse()!.payoff_matrix?.[i]?.[j] ?? this.reponse()!.payoff_matrix?.flat()[c] ?? 0;
        row.push({
          difficulty: this.reponse()!.grid[i][j],
          hider_strategy: this.reponse()!.hider_strategies[c],
          seeker_strategy: this.reponse()!.seeker_strategies[c],
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
    console.log(this.reponse());
    
  }

  choose(choice: choice) {
    console.log(`Chosen cell: (${choice.row}, ${choice.col}) with difficulty ${choice.difficulty}`);
    
    const selectedCell = weightedRandom(this.gameState()?.flatMap((row) => row) || [], this.reponse()!.hider_strategies)
    if (selectedCell !== undefined) {
      console.log(`Selected cell: (${selectedCell.row}, ${selectedCell.col})`);
      this.algorithmSelectedCell.set({ row: selectedCell.row, col: selectedCell.col });
      const isSame = selectedCell.row === choice.row && selectedCell.col === choice.col;
      if (isSame) {
        console.log("Chosen cell was selected by the algorithm!");
        this.animatedCell.set({ row: choice.row, col: choice.col, type: 'collision' });
        this.handleCollision(choice);
      } else {
        console.log("Chosen cell was NOT selected by the algorithm.");
        this.animatedCell.set({ row: choice.row, col: choice.col, type: 'miss' });
        this.handleMiss(choice);
      }
      setTimeout(() => this.animatedCell.set(null), 700);
    }
  }
  handleCollision(choice: choice) {
    const difficulty = choice.difficulty;
    if(difficulty == 1) {
      this.accumulator.update(score => score + scores["EASY"].lose);
    } else if (difficulty == 2) {
      this.accumulator.update(score => score + scores["NEUTRAL"].lose);
    } else if (difficulty == 3) {
      this.accumulator.update(score => score + scores["HARD"].lose);
    }
  }
  handleMiss(choice: choice) {
    const difficulty = choice.difficulty;
    if(difficulty == 1) {
      this.accumulator.update(score => score + scores["EASY"].win);
    } else if (difficulty == 2) {
      this.accumulator.update(score => score + scores["NEUTRAL"].win);
    } else if (difficulty == 3) {
      this.accumulator.update(score => score + scores["HARD"].win);
    }
  }

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
    "EASY":    {"win": 10, "lose": -5},
    "NEUTRAL": {"win": 15, "lose": -10},
    "HARD":    {"win": 20, "lose": -15}
}
