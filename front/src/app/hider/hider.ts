import { Component, computed, inject, Input, input, OnInit, signal } from '@angular/core';
import { HideAndSeekResponse, Http } from '../services/http';

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
    this.http.generateWorld(this.worldLength, this.worldWidth).subscribe({
      next: (response) => {
        console.log(response);
        this.reponse.set(response);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  reponse =signal<HideAndSeekResponse | null> (null);
  gameState = computed(() => {
    if (!this.reponse()) return null;
    const state: GameState = [];
    let c = 0
    for (let i = 0; i < this.reponse()!.grid.length; i++) {
      const row: choice[] = [];
      for (let j = 0; j < this.reponse()!.grid[i].length; j++) {
        row.push({
          difficulty: this.reponse()!.grid[i][j],
          hider_strategy: this.reponse()!.hider_strategies[c],
          seeker_strategy: this.reponse()!.seeker_strategies[c],
        });
        c++;
      }
      state.push(row);
    }
    
    return state;
  });
  debug = () => {
    console.log(this.gameState());
  }
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
}
type GameState = choice[][]

