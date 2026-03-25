import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, ClientDTO } from '../models/client.model';
import { API_CONFIG } from '../../core/api-config';

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private baseUrl = API_CONFIG.client; // legacy endpoints
  private baseUrlV2 = `${API_CONFIG.user}/clients-v2`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/getAllClients`);
  }

  getAllClientsV2(): Observable<ClientDTO[]> {
    return this.http.get<ClientDTO[]>(this.baseUrlV2).pipe(
      catchError(this.handleError)
    );
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<ClientDTO>(`${this.baseUrlV2}/${id}`).pipe(
      map((client) => client as Client),
      catchError(this.handleError)
    );
  }

  createClient(client: ClientDTO): Observable<ClientDTO> {
    return this.http.post<ClientDTO>(this.baseUrlV2, client).pipe(
      catchError(this.handleError)
    );
  }

  updateClient(id: string, client: ClientDTO): Observable<ClientDTO> {
    return this.http.put<ClientDTO>(`${this.baseUrlV2}/${id}`, client).pipe(
      catchError(this.handleError)
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrlV2}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  validateUsername(username: string): Observable<ValidationResult> {
    const params = new HttpParams().set('username', username);
    return this.http.post<ValidationResult>(`${this.baseUrlV2}/validate-username`, null, { params }).pipe(
      catchError((error) => {
        // New backend contract: 400 still returns ValidationResult body
        if (error?.error && typeof error.error === 'object' && 'isValid' in error.error && 'message' in error.error) {
          return of(error.error as ValidationResult);
        }
        return this.handleError(error);
      })
    );
  }

  validatePassword(password: string): Observable<ValidationResult> {
    const params = new HttpParams().set('password', password);
    return this.http.post<ValidationResult>(`${this.baseUrlV2}/validate-password`, null, { params }).pipe(
      catchError((error) => {
        if (error?.error && typeof error.error === 'object' && 'isValid' in error.error && 'message' in error.error) {
          return of(error.error as ValidationResult);
        }
        return this.handleError(error);
      })
    );
  }

  private handleError(error: any): Observable<never> {
    const message = error?.error?.message || error?.message || 'Server error';
    console.error('ClientService error:', error);
    return throwError(() => new Error(message));
  }

}
