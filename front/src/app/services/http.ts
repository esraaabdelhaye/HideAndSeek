import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface NewGameResponse {
  session_id: string;
  grid: number[][];
  payoff_matrix: number[][];
  hider_strategies: number[];
  seeker_strategies: number[];
  expected_value: number;
}
export type Role = 'hider' | 'seeker';
interface PlayRoundResponse {
  computer_row: number;
  computer_col: number;
  winner: "human" | "computer";
  points: number;
  human_score: number;
  computer_score: number;
  human_rounds_won: number;
  computer_rounds_won: number;
}
/* 
class NewGameResponse(BaseModel):
    session_id: str
    grid: list[list[int]]
    payoff_matrix: list[list[float]]
    hider_strategies: list[float]
    seeker_strategies: list[float]
    expected_value: float 
class PlayRoundResponse(BaseModel):
    computer_row: int
    computer_col: int
    winner: str # "human" / "computer"
    points: float
    human_score: float
    computer_score: float
    human_rounds_won: int
    computer_rounds_won: int
    
    */

@Injectable({
  providedIn: 'root',
})
export class Http {
  http = inject(HttpClient);
  base = 'http://127.0.0.1:8000/';

  generateWorld(worldLength: number, worldWidth: number, role: Role): Observable<NewGameResponse> {
    return this.http.post<NewGameResponse>(`${this.base}new-game`, {
      "n": worldLength,
      "m": worldWidth,
      "role": role
    });
  }

  playRound(human_col: number, human_row: number, session_id: string): Observable<PlayRoundResponse> {
    return this.http.post<PlayRoundResponse>(`${this.base}play-round`, {
      "human_col": human_col,
      "human_row": human_row,
      "session_id": session_id
    });
  }
}
