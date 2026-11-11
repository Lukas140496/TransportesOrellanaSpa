import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRendimiento } from './dashboard-rendimiento';

describe('DashboardRendimiento', () => {
  let component: DashboardRendimiento;
  let fixture: ComponentFixture<DashboardRendimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRendimiento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRendimiento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
