import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

export interface PackChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp?: Date;
}

export interface PackChatbotResponse {
  response: string;
  state: string;
  is_complete: boolean;
  current_field?: string;
  progress?: number;
  examples?: string[];
  collected_data?: any;
  validation_errors?: string[];
  pack_id?: string;
  error?: string;
}

export interface PackChatState {
  messages: PackChatMessage[];
  currentState: string;
  progress: number;
  isComplete: boolean;
  currentField?: string;
  examples: string[];
  isLoading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PackChatbotService {
  private readonly apiUrl = API_CONFIG.ai;

  private chatState = new BehaviorSubject<PackChatState>({
    messages: [],
    currentState: 'welcome',
    progress: 0,
    isComplete: false,
    examples: [],
    isLoading: false
  });

  public chatState$ = this.chatState.asObservable();

  constructor(private http: HttpClient) {}

  startConversation(): Observable<PackChatbotResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.updateState({ isLoading: true, error: undefined });

    return this.http.post<PackChatbotResponse>(`${this.apiUrl}/pack-chat/start`, {}, { headers });
  }

  sendMessage(message: string): Observable<PackChatbotResponse> {
    const currentState = this.chatState.value;
    const userMessage: PackChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.updateState({
      messages: [...currentState.messages, userMessage],
      isLoading: true,
      error: undefined
    });

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<PackChatbotResponse>(`${this.apiUrl}/pack-chat`, { message }, { headers });
  }

  applyResponse(response: PackChatbotResponse): void {
    const currentState = this.chatState.value;
    const botMessage: PackChatMessage = {
      role: 'bot',
      content: response.response,
      timestamp: new Date()
    };

    this.updateState({
      messages: [...currentState.messages, botMessage],
      currentState: response.state,
      progress: response.progress || 0,
      isComplete: !!response.is_complete,
      currentField: response.current_field,
      examples: response.examples || [],
      isLoading: false,
      error: response.error
    });
  }

  setError(errorMessage: string): void {
    this.updateState({
      isLoading: false,
      error: errorMessage
    });
  }

  resetConversation(): void {
    this.chatState.next({
      messages: [],
      currentState: 'welcome',
      progress: 0,
      isComplete: false,
      examples: [],
      isLoading: false,
      error: undefined
    });
  }

  getCurrentState(): PackChatState {
    return this.chatState.value;
  }

  private updateState(newState: Partial<PackChatState>): void {
    const currentState = this.chatState.value;
    this.chatState.next({ ...currentState, ...newState });
  }
}

