import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_CONFIG } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = API_CONFIG.auth;

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          const rawRole = res.role?.toString() ?? '';
          const normalizedRole = rawRole.replace(/^ROLE_/, '').toUpperCase();
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('role', normalizedRole);
          res.role = normalizedRole;
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    // Backend exposes admin creation at /api/admins/createAdmin
    // (and returns the created Admin object)
    return this.http.post<any>(`${API_CONFIG.admin}/createAdmin`, userData).pipe(
      tap(res => {
        if (res) {
          localStorage.setItem('user', JSON.stringify(res));
          localStorage.setItem('role', 'ADMIN');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
