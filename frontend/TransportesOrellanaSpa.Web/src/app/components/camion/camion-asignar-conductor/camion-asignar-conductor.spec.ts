import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionAsignarConductor } from './camion-asignar-conductor';

describe('CamionAsignarConductor', () => {
  let component: CamionAsignarConductor;
  let fixture: ComponentFixture<CamionAsignarConductor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionAsignarConductor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionAsignarConductor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
