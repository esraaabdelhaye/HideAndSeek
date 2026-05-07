import { Component, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Http, SimulationResponse, RoundSnapshot } from '../services/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
  imports: [DecimalPipe],
})
export class Simulation {
  http = inject(Http);

  worldLength = signal(3);
  worldWidth = signal(3);

  running = signal(false);
  roundLog = signal<RoundSnapshot[]>([]);
  gameValue = signal<number | null>(null);

  results = signal({
    hiderWins: 0,
    hiderLosses: 0,
    seekerWins: 0,
    seekerLosses: 0,
    hiderScore: 0,
    seekerScore: 0,
  });

  summary = computed(() => {
    const { hiderWins, seekerWins } = this.results();
    const total = hiderWins + seekerWins;
    return {
      total,
      hiderWinRate: total ? Math.round((hiderWins / total) * 100) : 0,
      seekerWinRate: total ? Math.round((seekerWins / total) * 100) : 0,
    };
  });

  async simulate() {
    if (this.running()) return;
    this.running.set(true);
    this.roundLog.set([]);
    this.gameValue.set(null);
    this.results.set({
      hiderWins: 0,
      hiderLosses: 0,
      seekerWins: 0,
      seekerLosses: 0,
      hiderScore: 0,
      seekerScore: 0,
    });

    try {
      const game = await lastValueFrom(
        this.http.generateWorld(this.worldLength(), this.worldWidth(), 'hider'),
      );

      this.gameValue.set(game.expected_value);

      const sim: SimulationResponse = await lastValueFrom(this.http.simulate(game.session_id));

      this.results.set({
        hiderWins: sim.hider_rounds_won,
        hiderLosses: sim.seeker_rounds_won,
        seekerWins: sim.seeker_rounds_won,
        seekerLosses: sim.hider_rounds_won,
        hiderScore: sim.hider_score,
        seekerScore: sim.seeker_score,
      });

      this.roundLog.set(sim.snapshots);
    } catch (err) {
      console.error('Simulation error:', err);
    }

    this.running.set(false);
  }
}
