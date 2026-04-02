import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_CONFIG } from './api-config';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }
  private getUrl(path: string, service: keyof typeof API_CONFIG = 'user'): string {
    const baseUrl = API_CONFIG[service];
    return `${baseUrl}${path}`;
  }
  get<T>(path: string, service: keyof typeof API_CONFIG = 'user'): Observable<T> {
    return this.http.get<T>(this.getUrl(path, service)).pipe(
      catchError(err => this.handleError<T>(err, path))
    );}
  post<T>(path: string, body: any, service: keyof typeof API_CONFIG = 'user'): Observable<T> {
    return this.http.post<T>(this.getUrl(path, service), body).pipe(
      catchError(err => this.handleError<T>(err, path))
    );
  }
  put<T>(path: string, body: any, service: keyof typeof API_CONFIG = 'user'): Observable<T> {
    return this.http.put<T>(this.getUrl(path, service), body).pipe(
      catchError(err => this.handleError<T>(err, path))
    );
  }
  delete<T>(path: string, service: keyof typeof API_CONFIG = 'user'): Observable<T> {
    return this.http.delete<T>(this.getUrl(path, service)).pipe(
      catchError(err => this.handleError<T>(err, path))
    );
  }
  private handleError<T>(error: any, path: string): Observable<T> {
    console.error('API Error:', error);
    // If it's a connection error (status 0), return mock data (Optional, could be removed or updated)
    if (error.status === 0 || error.status === 404) {
      console.warn('Backend unreachable. Returning mock data for path:', path);
      return of(this.getMockData(path) as T);
    }
    return throwError(() => error);
  }
  private getMockData(path: string): any {
    if (path.includes('/auth/login')) {
      return { token: 'mock-jwt-token', user: { email: 'admin@vermeg.com', role: 'ADMIN' }, role: 'ADMIN' };
    }
    if (path.includes('/auth/register')) {
      return { token: 'mock-jwt-token', user: { email: 'user@vermeg.com', role: 'CLIENT' }, role: 'CLIENT' };
    }
    if (path === '/produits') return [{ id: 1, nom: 'Assurance Auto', prix: 150, description: 'Couverture complète' }];
    if (path === '/packs') return [{ id: 1, nom: 'Pack Sante+', prix: 45, description: 'Dentaire et Optique' }];
    if (path === '/garanties') return [{ id: 1, nom: 'Bris de glace', montantMax: 500, description: 'Sans franchise' }];
    if (path === '/ai/chat') return { response: 'Ceci est une réponse simulée (Mock Mode). Le backend est actuellement injoignable.' };
    return [];
  }
}