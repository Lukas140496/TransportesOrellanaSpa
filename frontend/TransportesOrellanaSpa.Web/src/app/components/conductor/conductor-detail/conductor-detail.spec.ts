import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConductorDetail } from './conductor-detail';

describe('ConductorDetail', () => {
  let component: ConductorDetail;
  let fixture: ComponentFixture<ConductorDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConductorDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConductorDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
