import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  private readonly baseUrl = API_CONFIG.client;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.baseUrl).pipe(
      catchError((error) => {
        if (error?.status === 404) {
          return of([]);
        }
        return this.handleError(error);
      })
    );
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getClientByIdSafe(id: string): Observable<Client> {
    return this.getClientById(String(id ?? '').trim());
  }

  createClient(client: ClientDTO): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, client).pipe(
      catchError(this.handleError)
    );
  }

  updateClient(id: string, client: ClientDTO): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/${id}`, client).pipe(
      catchError(this.handleError)
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  searchClients(query: string): Observable<Client[]> {
    const params = new HttpParams().set('query', String(query ?? '').trim());
    return this.http.get<Client[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  validateUsername(username: string): Observable<ValidationResult> {
    const formData = new FormData();
    formData.append('username', String(username ?? '').trim());

    return this.http.post<ValidationResult>(`${this.baseUrl}/validate-username`, formData).pipe(
      catchError((error) => this.handleValidationError(error))
    );
  }

  validateEmail(email: string): Observable<ValidationResult> {
    const formData = new FormData();
    formData.append('email', String(email ?? '').trim().toLowerCase());

    return this.http.post<ValidationResult>(`${this.baseUrl}/validate-email`, formData).pipe(
      catchError((error) => this.handleValidationError(error))
    );
  }

  private handleValidationError(error: any): Observable<ValidationResult> {
    const details = error?.error;

    if (details && typeof details === 'object' && 'isValid' in details) {
      return of({
        isValid: Boolean(details.isValid),
        message: String(details.message ?? '')
      });
    }

    if (typeof details === 'string' && details.trim()) {
      return of({ isValid: false, message: details.trim() });
    }

    return this.handleError(error);
  }

  private handleError(error: any): Observable<never> {
    let message = 'Server error';

    const details = error?.error;
    const detailsMessage =
      typeof details === 'string'
        ? details.trim()
        : details && typeof details === 'object'
          ? (details as any).message || (details as any).error
          : undefined;

    if (error?.status === 0) {
      message = 'Network error - unable to connect to server';
    } else if (error?.status === 400) {
      message = detailsMessage || 'Donnees invalides';
    } else if (error?.status === 404) {
      message = detailsMessage || 'Client non trouve';
    } else if (error?.status === 409) {
      message = detailsMessage || 'Email ou username deja utilise';
    } else if (error?.status === 500) {
      message = detailsMessage || 'Internal server error';
    } else if (detailsMessage || error?.message) {
      message = detailsMessage || error?.message;
    } else if (error?.status) {
      message = `${error.status} ${error.statusText || ''}`.trim();
    }

    const apiError = new Error(message) as Error & {
      status?: number;
      statusText?: string;
      url?: string;
      details?: unknown;
    };
    apiError.status = error?.status;
    apiError.statusText = error?.statusText;
    apiError.url = error?.url;
    apiError.details = details;

    console.error('ClientService error:', error);
    return throwError(() => apiError);
  }
}
