import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface HideAndSeekResponse {
  grid: number[][];
  payoff_matrix: number[][];
  hider_strategies: number[];
  seeker_strategies: number[];
  expected_value: number;
}

@Injectable({
  providedIn: 'root',
})
export class Http {
  http = inject(HttpClient);
  base = 'http://127.0.0.1:8000/';

  generateWorld(worldLength: number, worldWidth: number): Observable<HideAndSeekResponse> {
    return this.http.get<HideAndSeekResponse>(`${this.base}grid/${worldLength}/${worldWidth}`);
  }
}
