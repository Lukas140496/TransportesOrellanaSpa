import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueDetail } from './remolque-detail';

describe('RemolqueDetail', () => {
  let component: RemolqueDetail;
  let fixture: ComponentFixture<RemolqueDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
