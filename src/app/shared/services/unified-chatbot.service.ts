import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

export enum ChatbotType {
  GARANTIE = 'garantie',
  PRODUIT = 'produit',
  PACK = 'pack'
}

export interface UnifiedChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp?: Date;
  chatbotType?: ChatbotType;
}

export interface UnifiedChatResponse {
  response: string;
  state?: string;
  is_complete: boolean;
  current_field?: string;
  progress?: number;
  examples?: string[];
  collected_data?: any;
  validation_errors?: string[];
  pack_id?: string;
  entity_id?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  chatbotType: ChatbotType;
  messages: UnifiedChatMessage[];
  currentState: string;
  progress: number;
  isComplete: boolean;
  currentField?: string;
  examples: string[];
  isLoading: boolean;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnifiedChatState {
  activeSession: ChatSession | null;
  sessions: ChatSession[];
  availableChatbots: ChatbotType[];
  globalError?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedChatbotService {
  private readonly apiUrl = API_CONFIG.ai;
  private readonly state$ = new BehaviorSubject<UnifiedChatState>({
    activeSession: null,
    sessions: [],
    availableChatbots: [ChatbotType.GARANTIE, ChatbotType.PRODUIT, ChatbotType.PACK]
  });
  private readonly sessionCreatedSubject = new Subject<ChatSession>();

  chatState$ = this.state$.asObservable();

  constructor(private http: HttpClient) {}

  getCurrentState(): UnifiedChatState {
    return this.state$.value;
  }

  onSessionCreated(): Observable<ChatSession> {
    return this.sessionCreatedSubject.asObservable();
  }

  setGlobalError(message?: string): void {
    this.state$.next({ ...this.state$.value, globalError: message });
  }

  startSession(chatbotType: ChatbotType): Observable<UnifiedChatResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const endpoint = this.getEndpoint(chatbotType, 'start');
    return this.http.post<UnifiedChatResponse>(endpoint, {}, { headers });
  }

  createAndActivateSession(chatbotType: ChatbotType, initialResponse: UnifiedChatResponse): void {
    const now = new Date();
    const session: ChatSession = {
      id: this.generateSessionId(),
      chatbotType,
      messages: [{
        role: 'bot',
        content: initialResponse.response,
        timestamp: now,
        chatbotType
      }],
      currentState: initialResponse.state || 'started',
      progress: initialResponse.progress || 0,
      isComplete: !!initialResponse.is_complete,
      currentField: initialResponse.current_field,
      examples: initialResponse.examples || [],
      isLoading: false,
      createdAt: now,
      updatedAt: now
    };

    const current = this.state$.value;
    this.state$.next({
      ...current,
      sessions: [session, ...current.sessions],
      activeSession: session,
      globalError: undefined
    });
    this.sessionCreatedSubject.next(session);
  }

  activateSession(sessionId: string): void {
    const current = this.state$.value;
    const session = current.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    this.state$.next({ ...current, activeSession: session, globalError: undefined });
  }

  deleteSession(sessionId: string): void {
    const current = this.state$.value;
    const sessions = current.sessions.filter((s) => s.id !== sessionId);
    const activeSession = current.activeSession?.id === sessionId ? (sessions[0] || null) : current.activeSession;
    this.state$.next({ ...current, sessions, activeSession });
  }

  resetSession(sessionId: string): void {
    const session = this.state$.value.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    this.deleteSession(sessionId);
  }

  sendMessage(message: string): Observable<UnifiedChatResponse> {
    const active = this.state$.value.activeSession;
    if (!active) {
      throw new Error('Aucune session active');
    }

    this.patchSession(active.id, {
      isLoading: true,
      error: undefined,
      messages: [...active.messages, {
        role: 'user',
        content: message,
        timestamp: new Date(),
        chatbotType: active.chatbotType
      }]
    });

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (active.chatbotType === ChatbotType.PACK) {
      return this.http.post<UnifiedChatResponse>(`${this.apiUrl}/pack-chat`, { message }, { headers });
    }

    const conversation_history = this.toHistory(this.getSessionById(active.id)?.messages || []);
    return this.http.post<UnifiedChatResponse>(
      `${this.apiUrl}/admin-chat`,
      { message, conversation_history, mode: 'creation' },
      { headers }
    );
  }

  updateChatSession(response: UnifiedChatResponse): void {
    const active = this.state$.value.activeSession;
    if (!active) return;

    const nextMessages = [
      ...active.messages,
      {
        role: 'bot' as const,
        content: response.response,
        timestamp: new Date(),
        chatbotType: active.chatbotType
      }
    ];

    this.patchSession(active.id, {
      messages: nextMessages,
      currentState: response.state || active.currentState,
      progress: response.progress || 0,
      isComplete: !!response.is_complete,
      currentField: response.current_field,
      examples: response.examples || [],
      isLoading: false,
      error: response.error
    });
  }

  getChatbotInfo(chatbotType: ChatbotType): { name: string; icon: string; color: string; description: string } {
    const map = {
      [ChatbotType.GARANTIE]: {
        name: 'Creation Garantie',
        icon: 'G',
        color: '#cf3f2e',
        description: 'Creation et validation des garanties'
      },
      [ChatbotType.PRODUIT]: {
        name: 'Creation Produit',
        icon: 'P',
        color: '#1f7ae0',
        description: 'Configuration des produits d assurance'
      },
      [ChatbotType.PACK]: {
        name: 'Creation Pack',
        icon: 'K',
        color: '#198754',
        description: 'Assemblage de packs avec produits'
      }
    };
    return map[chatbotType];
  }

  private getSessionById(sessionId: string): ChatSession | undefined {
    return this.state$.value.sessions.find((s) => s.id === sessionId);
  }

  private patchSession(sessionId: string, patch: Partial<ChatSession>): void {
    const current = this.state$.value;
    const sessions = current.sessions.map((session) =>
      session.id === sessionId ? { ...session, ...patch, updatedAt: new Date() } : session
    );
    const activeSession = sessions.find((s) => s.id === current.activeSession?.id) || null;
    this.state$.next({ ...current, sessions, activeSession });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private getEndpoint(chatbotType: ChatbotType, action: 'start' | 'chat'): string {
    if (chatbotType === ChatbotType.PACK) {
      return action === 'start' ? `${this.apiUrl}/pack-chat/start` : `${this.apiUrl}/pack-chat`;
    }
    return action === 'start' ? `${this.apiUrl}/admin-chat/start` : `${this.apiUrl}/admin-chat`;
  }

  private toHistory(messages: UnifiedChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
  }
}

