
import {
  Directive,
  ElementRef,
  HostListener,
  Optional,
  Self
} from '@angular/core';

import {
  NgControl
} from '@angular/forms';

import {
  formatearRut,
  limpiarRut
} from './rut-format';

@Directive({
  selector: '[appRutFormat]',
  standalone: true
})
export class RutFormatDirective {

  constructor(
    private readonly elementRef: ElementRef<HTMLInputElement>,
    @Optional() @Self() private readonly ngControl: NgControl
  ) {}

  @HostListener('input')
  onInput(): void {

    const input = this.elementRef.nativeElement;
    const valorOriginal = input.value;
    const posicionOriginal = input.selectionStart ?? valorOriginal.length;

    // Cuenta los caracteres válidos antes del cursor.
    const caracteresAntes = limpiarRut(
      valorOriginal.slice(0, posicionOriginal)
    ).length;

    const valorFormateado = formatearRut(valorOriginal);

    if (valorOriginal === valorFormateado) {
      return;
    }

    input.value = valorFormateado;

    // Actualiza el FormControl con el valor formateado.
    this.ngControl?.control?.setValue(
      valorFormateado
    );

    // Mantiene el cursor en una posición coherente.
    let nuevaPosicion = 0;
    let caracteresContados = 0;

    while (
      nuevaPosicion < valorFormateado.length &&
      caracteresContados < caracteresAntes
    ) {
      if (/[0-9K]/.test(valorFormateado[nuevaPosicion])) {
        caracteresContados++;
      }

      nuevaPosicion++;
    }

    input.setSelectionRange(
      nuevaPosicion,
      nuevaPosicion
    );
  }
}