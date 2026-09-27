import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const token = authService.getToken();

  const esLogin = req.url.includes('/auth/login');

  if (!token || esLogin) {
    return next(req);
  }

  const requestConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(requestConToken).pipe(

    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {

        authService.manejarSesionExpirada();

        return EMPTY;
      }

      return throwError(() => error);
    })

  );
};