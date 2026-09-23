import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionDetail } from './camion-detail';

describe('CamionDetail', () => {
  let component: CamionDetail;
  let fixture: ComponentFixture<CamionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
