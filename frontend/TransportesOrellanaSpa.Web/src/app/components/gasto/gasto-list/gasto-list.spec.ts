import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastoList } from './gasto-list';

describe('GastoList', () => {
  let component: GastoList;
  let fixture: ComponentFixture<GastoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
