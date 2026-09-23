import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConductorDesactivar } from './conductor-desactivar';

describe('ConductorDesactivar', () => {
  let component: ConductorDesactivar;
  let fixture: ComponentFixture<ConductorDesactivar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConductorDesactivar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConductorDesactivar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
