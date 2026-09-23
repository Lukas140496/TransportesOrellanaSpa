import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueAsignarCamion } from './remolque-asignar-camion';

describe('RemolqueAsignarCamion', () => {
  let component: RemolqueAsignarCamion;
  let fixture: ComponentFixture<RemolqueAsignarCamion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueAsignarCamion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueAsignarCamion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
