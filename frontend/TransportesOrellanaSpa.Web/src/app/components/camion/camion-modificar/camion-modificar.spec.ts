import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamionModificar } from './camion-modificar';

describe('CamionModificar', () => {
  let component: CamionModificar;
  let fixture: ComponentFixture<CamionModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamionModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CamionModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
