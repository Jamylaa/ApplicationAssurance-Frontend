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

interface ValidationApiResponse {
  isValid?: boolean;
  valid?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly baseUrl = API_CONFIG.client;

  constructor(private http: HttpClient) {}


  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.baseUrl).pipe(
      map((clients) => this.normalizeClients(clients)),
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
      map((client) => this.normalizeClient(client)),
      catchError(this.handleError)
    );
  }

  getClientByIdSafe(id: string): Observable<Client> {
    return this.getClientById(String(id ?? '').trim());
  }

  createClient(client: ClientDTO): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, client).pipe(
      map((createdClient) => this.normalizeClient(createdClient)),
      catchError(this.handleError)
    );
  }

  updateClient(id: string, client: ClientDTO): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/${id}`, client).pipe(
      map((updatedClient) => this.normalizeClient(updatedClient)),
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
      map((clients) => this.normalizeClients(clients)),
      catchError(this.handleError)
    );
  }

  validateUsername(username: string): Observable<ValidationResult> {
    const params = new HttpParams().set('username', username.trim());
    return this.http
      .post<ValidationApiResponse>(
        `${this.baseUrl}/validate-username`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .pipe(
        map((response) => this.normalizeValidationResult(response)),
        catchError((error) => this.handleValidationError(error))
      );
  }

  validateEmail(email: string): Observable<ValidationResult> {
    const params = new HttpParams().set('email', email.trim().toLowerCase());
    return this.http
      .post<ValidationApiResponse>(
        `${this.baseUrl}/validate-email`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .pipe(
        map((response) => this.normalizeValidationResult(response)),
        catchError((error) => this.handleValidationError(error))
      );
  }

  private handleValidationError(error: any): Observable<ValidationResult> {
    const details = error?.error;

    if (details && typeof details === 'object') {
      return of(this.normalizeValidationResult(details));
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

  private normalizeClients(clients: Client[] | null | undefined): Client[] {
    return Array.isArray(clients) ? clients.map((client) => this.normalizeClient(client)) : [];
  }

  private normalizeClient(client: Client | null | undefined): Client {
    const normalized = client ?? ({} as Client);

    return {
      ...normalized,
      userName: String(normalized.userName ?? '').trim(),
      email: String(normalized.email ?? '').trim().toLowerCase(),
      phone: Number(normalized.phone ?? 0),
      age: Number(normalized.age ?? 0),
      sexe: String(normalized.sexe ?? 'M'),
      profession: String(normalized.profession ?? '').trim(),
      situationFamiliale: String(normalized.situationFamiliale ?? 'CELIBATAIRE').trim(),
      maladieChronique: Boolean(normalized.maladieChronique),
      diabetique: Boolean(normalized.diabetique),
      tension: Boolean(normalized.tension),
      nombreBeneficiaires: Math.max(1, Number(normalized.nombreBeneficiaires ?? 1)),
      actif: Boolean(normalized.actif)
    };
  }

  private normalizeValidationResult(result: ValidationApiResponse | null | undefined): ValidationResult {
    return {
      isValid: Boolean(result?.isValid ?? result?.valid),
      message: String(result?.message ?? '')
    };
  }
}
