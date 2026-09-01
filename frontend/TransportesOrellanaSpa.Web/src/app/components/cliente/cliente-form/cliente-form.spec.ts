import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteForm } from './cliente-form';

describe('ClienteForm', () => {
  let component: ClienteForm;
  let fixture: ComponentFixture<ClienteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
