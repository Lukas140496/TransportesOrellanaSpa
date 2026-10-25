import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardOperacion } from './dashboard-operacion';

describe('DashboardOperacion', () => {
  let component: DashboardOperacion;
  let fixture: ComponentFixture<DashboardOperacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardOperacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardOperacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
