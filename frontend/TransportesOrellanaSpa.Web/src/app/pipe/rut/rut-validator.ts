
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

import { validarRut } from './rut-format';

export function rutValidator(): ValidatorFn {
  return (
    control: AbstractControl
  ): ValidationErrors | null => {

    const valor = control.value;

    // Validators.required se encarga del campo vacío.
    if (!valor) {
      return null;
    }

    return validarRut(String(valor))
      ? null
      : { rutInvalido: true };
  };
}