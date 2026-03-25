import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private baseUrl = API_CONFIG.ai;

  constructor(private http: HttpClient) { }

  chat(payload: any): Observable<any> {
    // payload should contain message, conversation_history, mode, client_id etc.
    return this.http.post<any>(`${this.baseUrl}/chat`, payload);
  }

  score(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/score`, data);
  }
}
