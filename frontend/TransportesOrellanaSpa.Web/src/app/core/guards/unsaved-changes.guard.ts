import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateComponent {

  puedeSalir(): boolean | Promise<boolean>;

}

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component
) => {

  if (
    typeof component.puedeSalir === 'function'
  ) {
    return component.puedeSalir();
  }

  return true;

};