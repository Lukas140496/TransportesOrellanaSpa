import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionForm } from './camion-form';

describe('CamionForm', () => {
  let component: CamionForm;
  let fixture: ComponentFixture<CamionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
