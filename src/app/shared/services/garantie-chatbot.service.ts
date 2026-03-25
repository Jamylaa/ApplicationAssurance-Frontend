import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class GarantieChatbotService {
  private baseUrl = API_CONFIG.ai;

  constructor(private http: HttpClient) {}

  startConversation(): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin-chat/start`, {});
  }

  chat(message: string, conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin-chat`, {
      message,
      conversation_history,
      mode: 'creation'
    });
  }
}

