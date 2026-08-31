import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionList } from './camion-list';

describe('CamionList', () => {
  let component: CamionList;
  let fixture: ComponentFixture<CamionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
