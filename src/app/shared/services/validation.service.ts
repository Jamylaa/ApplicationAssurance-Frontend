import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { ClientService, ValidationResult } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  constructor(private clientService: ClientService) {}

  validateUsername(username: string): Observable<ValidationResult> {
    const value = String(username ?? '').trim();

    if (!value) {
      return of({ isValid: false, message: 'Le username ne peut pas etre vide' });
    }
    if (value.length < 3) {
      return of({ isValid: false, message: 'Le username doit contenir au moins 3 caracteres' });
    }
    if (value.length > 30) {
      return of({ isValid: false, message: 'Le username ne peut pas depasser 30 caracteres' });
    }

    const usernamePattern = /^[A-Za-z]+(?:-[A-Za-z]+)*$/;
    if (!usernamePattern.test(value)) {
      return of({
        isValid: false,
        message: 'Le username doit contenir uniquement des lettres et des tirets (ex: jean-marc)'
      });
    }

    return this.clientService.validateUsername(value).pipe(
      map((response) => ({ isValid: response.isValid, message: response.message || 'Username valide' })),
      delay(250),
      catchError((error) => of({ isValid: false, message: error?.message || 'Username invalide' }))
    );
  }

  validatePassword(password: string): Observable<ValidationResult> {
    const value = String(password ?? '');

    if (!value) {
      return of({ isValid: false, message: 'Le mot de passe ne peut pas etre vide' });
    }
    if (value.length < 6) {
      return of({ isValid: false, message: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }
    if (value.includes(' ')) {
      return of({ isValid: false, message: 'Le mot de passe ne peut pas contenir d espaces' });
    }
    if (!/[A-Za-z]/.test(value)) {
      return of({ isValid: false, message: 'Le mot de passe doit contenir au moins une lettre' });
    }
    if (!/\d/.test(value)) {
      return of({ isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' });
    }

    return of({ isValid: true, message: 'Mot de passe valide' }).pipe(delay(250));
  }

  validateEmail(email: string): Observable<ValidationResult> {
    const value = String(email ?? '').trim();
    if (!value) {
      return of({ isValid: false, message: 'L email ne peut pas etre vide' });
    }

    const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(value)) {
      return of({ isValid: false, message: 'L email n a pas un format valide' });
    }

    return of({ isValid: true, message: 'Email valide' }).pipe(delay(250));
  }

  validatePhone(phone: number | string): ValidationResult {
    const value = String(phone ?? '').trim();
    if (!value) {
      return { isValid: false, message: 'Le telephone ne peut pas etre vide' };
    }
    if (!/^\d{8}$/.test(value)) {
      return { isValid: false, message: 'Le numero de telephone doit contenir 8 chiffres' };
    }
    if (!/^[2-9]\d{7}$/.test(value)) {
      return { isValid: false, message: 'Le numero doit commencer par 2, 3, 4, 5, 6, 7, 8 ou 9' };
    }

    return { isValid: true, message: 'Telephone valide' };
  }
}
