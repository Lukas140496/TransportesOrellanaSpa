import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueForm } from './remolque-form';

describe('RemolqueForm', () => {
  let component: RemolqueForm;
  let fixture: ComponentFixture<RemolqueForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
