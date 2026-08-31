import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeDetail } from './viaje-detail';

describe('ViajeDetail', () => {
  let component: ViajeDetail;
  let fixture: ComponentFixture<ViajeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
