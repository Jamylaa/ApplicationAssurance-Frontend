import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class UserValidator {
  static readonly USERNAME_REGEX = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
  static readonly PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
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
