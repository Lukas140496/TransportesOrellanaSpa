import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardGastos } from './dashboard-gastos';

describe('DashboardGastos', () => {
  let component: DashboardGastos;
  let fixture: ComponentFixture<DashboardGastos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGastos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardGastos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
