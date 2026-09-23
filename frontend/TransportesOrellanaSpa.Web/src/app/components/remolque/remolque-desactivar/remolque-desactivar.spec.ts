import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueDesactivar } from './remolque-desactivar';

describe('RemolqueDesactivar', () => {
  let component: RemolqueDesactivar;
  let fixture: ComponentFixture<RemolqueDesactivar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueDesactivar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueDesactivar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
