
import { Pipe, PipeTransform } from '@angular/core';

import { formatearRut } from './rut-format';

@Pipe({
  name: 'rut',
  standalone: true
})
export class RutPipe implements PipeTransform {

  transform(valor: string | null | undefined): string {
    if (!valor) {
      return '';
    }

    return formatearRut(valor);
  }
}