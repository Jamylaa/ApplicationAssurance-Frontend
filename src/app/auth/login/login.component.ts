import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string = '';
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$')]],
      password: ['', [Validators.required, Validators.minLength(7)]]
    });
  }
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          const role = res.role?.toString().replace(/^ROLE_/, '').toUpperCase();
          if (role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else if (role === 'CLIENT') {
            this.router.navigate(['/client']);
          } else {
            this.error = 'Rôle non reconnu';
          }
        },
        error: (err) => {
          this.error = 'Identifiants invalides';
        }
      });
    }
  }
}