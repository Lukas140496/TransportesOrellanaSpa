import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueModificar } from './remolque-modificar';

describe('RemolqueModificar', () => {
  let component: RemolqueModificar;
  let fixture: ComponentFixture<RemolqueModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
