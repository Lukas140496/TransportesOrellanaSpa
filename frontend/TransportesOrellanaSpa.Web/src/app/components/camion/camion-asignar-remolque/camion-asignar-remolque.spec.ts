import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionAsignarRemolque } from './camion-asignar-remolque';

describe('CamionAsignarRemolque', () => {
  let component: CamionAsignarRemolque;
  let fixture: ComponentFixture<CamionAsignarRemolque>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionAsignarRemolque]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionAsignarRemolque);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
