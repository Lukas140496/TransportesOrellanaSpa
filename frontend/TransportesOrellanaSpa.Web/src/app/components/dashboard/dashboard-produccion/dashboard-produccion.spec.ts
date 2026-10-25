import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardProduccion } from './dashboard-produccion';

describe('DashboardProduccion', () => {
  let component: DashboardProduccion;
  let fixture: ComponentFixture<DashboardProduccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardProduccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardProduccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
