import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemolqueList } from './remolque-list';

describe('RemolqueList', () => {
  let component: RemolqueList;
  let fixture: ComponentFixture<RemolqueList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemolqueList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemolqueList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
