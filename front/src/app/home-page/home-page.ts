import { Component, signal } from '@angular/core';
import { Hider } from "../hider/hider";
import { Seeker } from "../seeker/seeker";
import { Simulation } from "../simulation/simulation";

type mode = 'simulation' | 'hider' | 'seeker' | null;

@Component({
  selector: 'app-home-page',
  imports: [Hider, Seeker, Simulation],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  mode = signal<mode>(null);
  worldLength = signal<number>(5);
  worldWidth = signal<number>(5);
  reset = () => {
    this.mode.set(null);
  }
  debug = () => {
    console.log(`Mode: ${this.mode()}`);
    console.log(`World Length: ${this.worldLength()}`);
    console.log(`World Width: ${this.worldWidth()}`);
  }
}
