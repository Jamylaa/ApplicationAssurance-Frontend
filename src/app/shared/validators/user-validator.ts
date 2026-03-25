import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class UserValidator {
  // Un seul mot, ou mots separes par tirets (pas d'espace, pas de double tiret)
  static readonly USERNAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

  // Minimum 6 caracteres, au moins 1 lettre et 1 chiffre
  static readonly PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  // 8 chiffres tunisiens commencant par 2-9
  static readonly TUNISIAN_PHONE_REGEX = /^[2-9]\d{7}$/;

  static usernameFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim();
      if (!value) {
        return null;
      }
      return UserValidator.USERNAME_REGEX.test(value) ? null : { usernameFormat: true };
    };
  }

  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');
      if (!value) {
        return null;
      }
      return UserValidator.PASSWORD_REGEX.test(value) ? null : { passwordStrength: true };
    };
  }

  static tunisianPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '').trim();
      if (!value) {
        return null;
      }
      return UserValidator.TUNISIAN_PHONE_REGEX.test(value) ? null : { tunisianPhone: true };
    };
  }
}

