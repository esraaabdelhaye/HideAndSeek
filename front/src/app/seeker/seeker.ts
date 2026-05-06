import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { NewGameResponse, Http } from '../services/http';

@Component({
  selector: 'app-seeker',
  imports: [],
  templateUrl: './seeker.html',
  styleUrl: './seeker.css',
})
export class Seeker implements OnInit {
  @Input() worldLength!: number;
  @Input() worldWidth!: number;
  http = inject(Http);
  

  ngOnInit(): void {
    this.play();
  }
  
  play = () => {
    this.http.generateWorld(this.worldLength, this.worldWidth, 'seeker').subscribe({
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
    for (let i = 0; i < this.response()!.grid.length; i++) {
      const row: choice[] = [];
      for (let j = 0; j < this.response()!.grid[i].length; j++) {
        row.push({
          difficulty: this.response()!.grid[i][j],
          hider_strategy: this.response()!.hider_strategies[c],
          seeker_strategy: this.response()!.seeker_strategies[c],
          row: i,
          col: j,
          payoff_if_hider_wins: this.response()!.payoff_matrix?.[i]?.[j] ?? this.response()!.payoff_matrix?.flat()[c] ?? 0,
          payoff_if_seeker_wins: -(this.response()!.payoff_matrix?.[i]?.[j] ?? this.response()!.payoff_matrix?.flat()[c] ?? 0)
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
    console.log(`Chosen cell: (${choice.row}, ${choice.col}) with difficulty ${choice.difficulty}`);
    const selectedCell = weightedRandom(this.gameState()?.flatMap((row) => row) || [], this.response()!.hider_strategies)
    if (selectedCell !== undefined) {
      console.log(`Selected cell (hider location): (${selectedCell.row}, ${selectedCell.col})`);
      this.algorithmSelectedCell.set({ row: selectedCell.row, col: selectedCell.col });
      const isSame = selectedCell.row === choice.row && selectedCell.col === choice.col;
      if (isSame) {
        console.log("Chosen cell was where hider is!");
        this.animatedCell.set({ row: choice.row, col: choice.col, type: 'collision' });
        this.handleCollision(choice);
      } else {
        console.log("Chosen cell was NOT where hider is.");
        this.animatedCell.set({ row: choice.row, col: choice.col, type: 'miss' });
        this.handleMiss(choice);
      }
      setTimeout(() => this.animatedCell.set(null), 700);
    }
  }
  
  handleCollision(choice: choice) {
    const difficulty = choice.difficulty;
    if(difficulty == 3) {
      this.accumulator.update(score => score + scores["EASY"].win);
    } else if (difficulty == 2) {
      this.accumulator.update(score => score + scores["NEUTRAL"].win);
    } else if (difficulty == 1) {
      this.accumulator.update(score => score + scores["HARD"].win);
    }
  }
  
  handleMiss(choice: choice) {
    const difficulty = choice.difficulty;
    if(difficulty == 3) {
      this.accumulator.update(score => score + scores["EASY"].lose);
    } else if (difficulty == 2) {
      this.accumulator.update(score => score + scores["NEUTRAL"].lose);
    } else if (difficulty == 1) {
      this.accumulator.update(score => score + scores["HARD"].lose);
    }
  }

  accumulator = signal(0);
  animatedCell = signal<{ row: number; col: number; type: 'collision' | 'miss' } | null>(null);
  algorithmSelectedCell = signal<{ row: number; col: number } | null>(null);
}

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
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const randomNum = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    currentWeight += weights[i];
    if (randomNum < currentWeight) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
}

const scores: Record<string, { win: number; lose: number }> = {
    "EASY":    {"win": 15, "lose": -10},
    "NEUTRAL": {"win": 10, "lose": -15},
    "HARD":    {"win": 5, "lose": -20}
}
