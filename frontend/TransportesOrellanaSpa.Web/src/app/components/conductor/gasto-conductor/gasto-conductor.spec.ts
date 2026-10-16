import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastoConductor } from './gasto-conductor';

describe('GastoConductor', () => {
  let component: GastoConductor;
  let fixture: ComponentFixture<GastoConductor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastoConductor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastoConductor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
