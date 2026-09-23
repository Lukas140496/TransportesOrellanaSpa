import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeModificar } from './viaje-modificar';

describe('ViajeModificar', () => {
  let component: ViajeModificar;
  let fixture: ComponentFixture<ViajeModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
