import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeForm } from './viaje-form';

describe('ViajeForm', () => {
  let component: ViajeForm;
  let fixture: ComponentFixture<ViajeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
