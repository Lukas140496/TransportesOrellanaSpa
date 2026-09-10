import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteModificar } from './cliente-modificar';

describe('ClienteModificar', () => {
  let component: ClienteModificar;
  let fixture: ComponentFixture<ClienteModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
