import { Component, inject, signal, computed } from '@angular/core';
import { NewGameResponse, Http } from '../services/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
})
export class Simulation {
  http = inject(Http);

  rounds = signal(100);
  worldLength = signal(3);
  worldWidth = signal(3);

  running = signal(false);
  logs = signal<string[]>([]);

  results = signal({
    hiderWins: 0,
    hiderLosses: 0,
    seekerWins: 0,
    seekerLosses: 0
  });

  resultsText = computed(() => JSON.stringify(this.results(), null, 2));
  summary = computed(() => {
    const current = this.results();
    const total = current.hiderWins + current.hiderLosses + current.seekerWins + current.seekerLosses;
    const hiderWinRate = total ? Math.round((current.hiderWins / total) * 100) : 0;
    const seekerWinRate = total ? Math.round((current.seekerWins / total) * 100) : 0;

    return {
      total,
      hiderWinRate,
      seekerWinRate,
    };
  });

  async simulate() {
    if (this.running()) return;
    this.running.set(true);
    this.logs.set([]);
    this.results.set({ hiderWins: 0, hiderLosses: 0, seekerWins: 0, seekerLosses: 0 });

    /* const rounds = this.rounds();
    for (let r = 0; r < rounds; r++) {
      try {
        const response = await lastValueFrom(this.http.generateWorld(this.worldLength(), this.worldWidth()));
        this.runOne(response);
      } catch (err) {
        this.pushLog(`Round ${r + 1}: error fetching world: ${err}`);
      }
    } */

    this.pushLog(`Simulation finished: ${this.rounds} rounds`);
    this.pushLog(JSON.stringify(this.results(), null, 2));
    console.log('Simulation results', this.results());
    this.running.set(false);
  }

  runOne(response: NewGameResponse) {
    const items = this.flattenGrid(response);
    const hiderChoice = weightedRandom(items, response.hider_strategies);
    const seekerChoice = weightedRandom(items, response.seeker_strategies);

    if (!hiderChoice || !seekerChoice) {
      this.pushLog('Invalid choices in a round');
      return;
    }

    const found = hiderChoice.row === seekerChoice.row && hiderChoice.col === seekerChoice.col;
    if (found) {
      // seeker found hider => seeker wins
      this.results.update(r => ({ ...r, seekerWins: r.seekerWins + 1, hiderLosses: r.hiderLosses + 1 }));
    } else {
      // hider escaped => hider wins
      this.results.update(r => ({ ...r, hiderWins: r.hiderWins + 1, seekerLosses: r.seekerLosses + 1 }));
    }
  }

  flattenGrid(response: NewGameResponse) {
    const items: choice[] = [];
    let c = 0;
    for (let i = 0; i < response.grid.length; i++) {
      for (let j = 0; j < response.grid[i].length; j++) {
        items.push({
          difficulty: response.grid[i][j],
          hider_strategy: response.hider_strategies[c],
          seeker_strategy: response.seeker_strategies[c],
          row: i,
          col: j,
          payoff_if_hider_wins: response.payoff_matrix?.[i]?.[j] ?? response.payoff_matrix?.flat()[c] ?? 0,
          payoff_if_seeker_wins: -(response.payoff_matrix?.[i]?.[j] ?? response.payoff_matrix?.flat()[c] ?? 0)
        });
        c++;
      }
    }
    return items;
  }

  pushLog(text: string) {
    this.logs.update(l => [...l, text]);
  }
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

function weightedRandom(items: choice[], weights: number[]): any {
  if (!items || items.length === 0) return undefined;
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const randomNum = Math.random() * totalWeight;
  let currentWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    currentWeight += weights[i];
    if (randomNum < currentWeight) return items[i];
  }
  return items[items.length - 1];
}
