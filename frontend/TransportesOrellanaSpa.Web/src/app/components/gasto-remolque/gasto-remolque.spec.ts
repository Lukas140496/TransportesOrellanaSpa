import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastoRemolque } from './gasto-remolque';

describe('GastoRemolque', () => {
  let component: GastoRemolque;
  let fixture: ComponentFixture<GastoRemolque>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastoRemolque]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastoRemolque);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
