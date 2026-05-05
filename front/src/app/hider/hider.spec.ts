import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hider } from './hider';

describe('Hider', () => {
  let component: Hider;
  let fixture: ComponentFixture<Hider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hider],
    }).compileComponents();

    fixture = TestBed.createComponent(Hider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
