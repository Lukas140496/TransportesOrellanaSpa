import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionDesactivar } from './camion-desactivar';

describe('CamionDesactivar', () => {
  let component: CamionDesactivar;
  let fixture: ComponentFixture<CamionDesactivar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionDesactivar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionDesactivar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});