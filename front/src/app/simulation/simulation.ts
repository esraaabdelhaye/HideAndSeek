import { Component, inject, signal, computed } from '@angular/core';
import { NewGameResponse, Http, RoundSnapshot, SimulationResponse } from '../services/http';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
})
export class Simulation {
  http = inject(Http);

  private readonly ROUNDS = 100;
  worldLength = signal(3);
  worldWidth = signal(3);

  running = signal(false);
  logs = signal<string[]>([]);

  results = signal({
    hiderWins: 0,
    seekerWins: 0,
    hiderScore: 0,
    seekerScore: 0
  });

  resultsText = computed(() => JSON.stringify(this.results(), null, 2));
  summary = computed(() => {
    const current = this.results();
    const total = current.hiderWins + current.seekerWins;
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
    this.results.set({ hiderWins: 0, seekerWins: 0,  hiderScore: 0, seekerScore: 0 });
    
    this.http.generateWorld(this.worldLength(), this.worldWidth(), 'hider').subscribe({
      next: (response) => {
        this.http.simulate((response as any)?.session_id ?? '').subscribe({
          next: (simulationResponse) => {
            console.log(simulationResponse);
            
            for (let r = 0; r < this.ROUNDS; r++) {
              const snapshot = (simulationResponse as any)?.snapshots[r] ?? {
                round: r + 1,
                hider_row: -1,
                hider_col: -1,
                seeker_row: -1,
                seeker_col: -1,
                winner: 'hider',
                points: 0
              };
              this.runOne(snapshot);
            }
            this.pushLog(`Simulation finished: ${this.ROUNDS} rounds`);
            this.pushLog(JSON.stringify(this.results(), null, 2));
            this.running.set(false);
            this.results.update(r => ({ ...r , hiderScore: simulationResponse.hider_score, seekerScore: simulationResponse.seeker_score }));
          },
          error: (error) => {
            console.error('Simulation error:', error);
            this.running.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Generate world error:', error);
        this.running.set(false);
      }
    });
  }

  runOne(snap: RoundSnapshot) {
    const found = snap.winner === 'seeker';
    const points = snap.points || 0;
    
    if (found) {
      this.results.update(r => ({
        ...r,
        seekerWins: r.seekerWins + 1,
        seekerScore: r.seekerScore + points
      }));
    } else {
      this.results.update(r => ({
        ...r,
        hiderWins: r.hiderWins + 1,
        hiderScore: r.hiderScore + points
      }));
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
