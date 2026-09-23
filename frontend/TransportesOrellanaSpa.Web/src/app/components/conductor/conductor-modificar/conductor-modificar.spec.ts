import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConductorModificar } from './conductor-modificar';

describe('ConductorModificar', () => {
  let component: ConductorModificar;
  let fixture: ComponentFixture<ConductorModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConductorModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConductorModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
