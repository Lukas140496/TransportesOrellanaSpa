import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViajeList } from './viaje-list';

describe('ViajeList', () => {
  let component: ViajeList;
  let fixture: ComponentFixture<ViajeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViajeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
