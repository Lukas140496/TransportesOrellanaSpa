import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiPerfil } from './mi-perfil';

describe('MiPerfil', () => {
  let component: MiPerfil;
  let fixture: ComponentFixture<MiPerfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPerfil]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiPerfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
