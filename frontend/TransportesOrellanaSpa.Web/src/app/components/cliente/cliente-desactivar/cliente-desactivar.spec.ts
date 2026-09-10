import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteDesactivar } from './cliente-desactivar';

describe('ClienteDesactivar', () => {
  let component: ClienteDesactivar;
  let fixture: ComponentFixture<ClienteDesactivar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteDesactivar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteDesactivar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
