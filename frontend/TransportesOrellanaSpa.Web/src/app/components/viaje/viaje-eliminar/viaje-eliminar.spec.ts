import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeEliminar } from './viaje-eliminar';

describe('ViajeEliminar', () => {
  let component: ViajeEliminar;
  let fixture: ComponentFixture<ViajeEliminar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeEliminar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeEliminar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
