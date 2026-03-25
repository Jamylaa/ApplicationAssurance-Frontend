# 🚀 Prompt Complet - Intégration Frontend Chatbots Unifiés
## 📋 Objectif
Intégrer les trois chatbots (Garanties, Produits, Packs) dans une interface frontend Angular unifiée avec navigation intelligente.
---
## 🎯 Architecture Globale

### **Structure des Services**
```
src/app/services/
├── unified-chatbot.service.ts     # Service principal unifié
├── garantie-chatbot.service.ts    # Service spécifique garanties
├── product-chatbot.service.ts     # Service spécifique produits  
├── pack-chatbot.service.ts        # Service spécifique packs
└── chat-session.service.ts        # Gestion des sessions
```

### **Structure des Composants**
```
src/app/components/
├── unified-chatbot/
│   ├── unified-chatbot.component.ts
│   ├── unified-chatbot.component.html
│   └── unified-chatbot.component.scss
├── chatbot-selector/
│   ├── chatbot-selector.component.ts
│   ├── chatbot-selector.component.html
│   └── chatbot-selector.component.scss
└── chat-history/
    ├── chat-history.component.ts
    ├── chat-history.component.html
    └── chat-history.component.scss
```

---

## 🔧 Étape 1: Service Principal Unifié

**Fichier :** `src/app/services/unified-chatbot.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export enum ChatbotType {
  GARANTIE = 'garantie',
  PRODUIT = 'produit', 
  PACK = 'pack'
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp?: Date;
  chatbotType?: ChatbotType;
}

export interface ChatbotResponse {
  response: string;
  state: string;
  is_complete: boolean;
  current_field?: string;
  progress?: number;
  examples?: string[];
  collected_data?: any;
  validation_errors?: string[];
  entity_id?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  chatbotType: ChatbotType;
  messages: ChatMessage[];
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
  isLoading: boolean;
  globalError?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedChatbotService {
  private readonly apiUrl = environment.apiUrl + '/api';
  private chatState = new BehaviorSubject<UnifiedChatState>({
    activeSession: null,
    sessions: [],
    availableChatbots: [ChatbotType.GARANTIE, ChatbotType.PRODUIT, ChatbotType.PACK],
    isLoading: false
  });

  public chatState$ = this.chatState.asObservable();
  private sessionCreated$ = new Subject<ChatSession>();

  constructor(private http: HttpClient) {}

  /**
   * Démarre une nouvelle session de chatbot
   */
  startSession(chatbotType: ChatbotType): Observable<ChatbotResponse> {
    const sessionId = this.generateSessionId();
    const endpoint = this.getEndpoint(chatbotType, 'start');
    
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.post<ChatbotResponse>(
      endpoint, 
      {}, 
      { headers }
    );
  }

  /**
   * Envoie un message à la session active
   */
  sendMessage(message: string): Observable<ChatbotResponse> {
    const activeSession = this.chatState.value.activeSession;
    
    if (!activeSession) {
      throw new Error('Aucune session active');
    }

    // Mettre à jour l'état pour montrer le chargement
    this.updateSessionLoading(activeSession.id, true);

    // Ajouter le message utilisateur à l'historique
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      chatbotType: activeSession.chatbotType
    };

    this.addMessageToSession(activeSession.id, userMessage);

    const endpoint = this.getEndpoint(activeSession.chatbotType, 'chat');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.post<ChatbotResponse>(
      endpoint,
      { message },
      { headers }
    );
  }

  /**
   * Met à jour l'état du chatbot avec la réponse du serveur
   */
  updateChatSession(response: ChatbotResponse): void {
    const activeSession = this.chatState.value.activeSession;
    
    if (!activeSession) {
      return;
    }

    const botMessage: ChatMessage = {
      role: 'bot',
      content: response.response,
      timestamp: new Date(),
      chatbotType: activeSession.chatbotType
    };

    this.addMessageToSession(activeSession.id, botMessage);

    // Mettre à jour les autres propriétés de la session
    const updatedSession: ChatSession = {
      ...activeSession,
      currentState: response.state,
      progress: response.progress || 0,
      isComplete: response.is_complete,
      currentField: response.current_field,
      examples: response.examples || [],
      isLoading: false,
      error: response.error,
      updatedAt: new Date()
    };

    this.updateSession(updatedSession);

    // Si la conversation est terminée avec succès
    if (response.is_complete && !response.error && response.entity_id) {
      this.handleSessionCompletion(updatedSession, response.entity_id);
    }
  }

  /**
   * Active une session existante
   */
  activateSession(sessionId: string): void {
    const currentState = this.chatState.value;
    const session = currentState.sessions.find(s => s.id === sessionId);
    
    if (session) {
      this.chatState.next({
        ...currentState,
        activeSession: session
      });
    }
  }

  /**
   * Crée et active une nouvelle session
   */
  createAndActivateSession(chatbotType: ChatbotType, initialResponse: ChatbotResponse): void {
    const newSession: ChatSession = {
      id: this.generateSessionId(),
      chatbotType,
      messages: [],
      currentState: initialResponse.state,
      progress: initialResponse.progress || 0,
      isComplete: initialResponse.is_complete,
      currentField: initialResponse.current_field,
      examples: initialResponse.examples || [],
      isLoading: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentState = this.chatState.value;
    const updatedSessions = [...currentState.sessions, newSession];

    this.chatState.next({
      ...currentState,
      sessions: updatedSessions,
      activeSession: newSession
    });

    this.sessionCreated$.next(newSession);
  }

  /**
   * Supprime une session
   */
  deleteSession(sessionId: string): void {
    const currentState = this.chatState.value;
    const updatedSessions = currentState.sessions.filter(s => s.id !== sessionId);
    
    let newActiveSession = currentState.activeSession;
    if (currentState.activeSession?.id === sessionId) {
      newActiveSession = updatedSessions.length > 0 ? updatedSessions[0] : null;
    }

    this.chatState.next({
      ...currentState,
      sessions: updatedSessions,
      activeSession: newActiveSession
    });
  }

  /**
   * Réinitialise une session
   */
  resetSession(sessionId: string): void {
    const session = this.chatState.value.sessions.find(s => s.id === sessionId);
    if (session) {
      this.startSession(session.chatbotType).subscribe({
        next: (response) => {
          this.createAndActivateSession(session.chatbotType, response);
        },
        error: (error) => {
          console.error('Erreur lors de la réinitialisation:', error);
        }
      });
    }
  }

  /**
   * Obtient l'état actuel
   */
  getCurrentState(): UnifiedChatState {
    return this.chatState.value;
  }

  /**
   * Observable pour les nouvelles sessions
   */
  onSessionCreated(): Observable<ChatSession> {
    return this.sessionCreated$.asObservable();
  }

  /**
   * Gère la complétion d'une session
   */
  private handleSessionCompletion(session: ChatSession, entityId: string): void {
    // Optionnel: Émettre un événement, naviguer vers la page de détails, etc.
    console.log(`Session ${session.chatbotType} terminée avec l'ID: ${entityId}`);
    
    // Vous pouvez ajouter ici une notification ou une redirection
    // this.router.navigate([`/${session.chatbotType}s`, entityId]);
  }

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtient l'endpoint approprié selon le type de chatbot
   */
  private getEndpoint(chatbotType: ChatbotType, action: 'start' | 'chat'): string {
    const endpoints = {
      [ChatbotType.GARANTIE]: {
        start: `${this.apiUrl}/admin-chat/start`,
        chat: `${this.apiUrl}/admin-chat`
      },
      [ChatbotType.PRODUIT]: {
        start: `${this.apiUrl}/admin-chat/start`,
        chat: `${this.apiUrl}/admin-chat`
      },
      [ChatbotType.PACK]: {
        start: `${this.apiUrl}/pack-chat/start`,
        chat: `${this.apiUrl}/pack-chat`
      }
    };

    return endpoints[chatbotType][action];
  }

  /**
   * Ajoute un message à une session
   */
  private addMessageToSession(sessionId: string, message: ChatMessage): void {
    const currentState = this.chatState.value;
    const sessionIndex = currentState.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const updatedSessions = [...currentState.sessions];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        messages: [...updatedSessions[sessionIndex].messages, message],
        updatedAt: new Date()
      };

      const updatedActiveSession = currentState.activeSession?.id === sessionId 
        ? { ...updatedSessions[sessionIndex] }
        : currentState.activeSession;

      this.chatState.next({
        ...currentState,
        sessions: updatedSessions,
        activeSession: updatedActiveSession
      });
    }
  }

  /**
   * Met à jour une session
   */
  private updateSession(updatedSession: ChatSession): void {
    const currentState = this.chatState.value;
    const sessionIndex = currentState.sessions.findIndex(s => s.id === updatedSession.id);
    
    if (sessionIndex !== -1) {
      const updatedSessions = [...currentState.sessions];
      updatedSessions[sessionIndex] = updatedSession;

      const updatedActiveSession = currentState.activeSession?.id === updatedSession.id 
        ? updatedSession 
        : currentState.activeSession;

      this.chatState.next({
        ...currentState,
        sessions: updatedSessions,
        activeSession: updatedActiveSession
      });
    }
  }

  /**
   * Met à jour l'état de chargement d'une session
   */
  private updateSessionLoading(sessionId: string, isLoading: boolean): void {
    const currentState = this.chatState.value;
    const sessionIndex = currentState.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const updatedSessions = [...currentState.sessions];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        isLoading
      };

      const updatedActiveSession = currentState.activeSession?.id === sessionId 
        ? { ...updatedSessions[sessionIndex], isLoading }
        : currentState.activeSession;

      this.chatState.next({
        ...currentState,
        sessions: updatedSessions,
        activeSession: updatedActiveSession
      });
    }
  }

  /**
   * Obtient les informations d'affichage pour un type de chatbot
   */
  getChatbotInfo(chatbotType: ChatbotType): { name: string; icon: string; color: string; description: string } {
    const info = {
      [ChatbotType.GARANTIE]: {
        name: 'Création de Garanties',
        icon: '🛡️',
        color: '#e74c3c',
        description: 'Créez des garanties d\'assurance avec couverture et plafonds'
      },
      [ChatbotType.PRODUIT]: {
        name: 'Création de Produits',
        icon: '📦',
        color: '#3498db',
        description: 'Configurez des produits d\'assurance avec garanties associées'
      },
      [ChatbotType.PACK]: {
        name: 'Création de Packs',
        icon: '📋',
        color: '#27ae60',
        description: 'Assemblez des packs personnalisés avec plusieurs produits'
      }
    };

    return info[chatbotType];
  }
}
```

---

## 🎨 Étape 2: Composant Principal Unifié

**Fichier :** `src/app/components/unified-chatbot/unified-chatbot.component.ts`

```typescript
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { 
  UnifiedChatbotService, 
  ChatbotType, 
  ChatSession, 
  ChatMessage,
  UnifiedChatState 
} from '../../services/unified-chatbot.service';

@Component({
  selector: 'app-unified-chatbot',
  templateUrl: './unified-chatbot.component.html',
  styleUrls: ['./unified-chatbot.component.scss']
})
export class UnifiedChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  chatState: UnifiedChatState;
  userInput: string = '';
  isTyping: boolean = false;
  showSessionSelector: boolean = false;
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('userInputField') private userInputField!: ElementRef;

  // Informations du chatbot actif
  get activeSession(): ChatSession | null {
    return this.chatState?.activeSession;
  }

  get currentExamples(): string[] {
    return this.activeSession?.examples || [];
  }

  get currentFieldLabel(): string {
    if (!this.activeSession?.currentField) return '';
    
    const fieldLabels: { [key: string]: string } = {
      // Champs Garantie
      'nom_garantie': 'Nom de la garantie',
      'description': 'Description',
      'type_garantie': 'Type de garantie',
      'plafond_annuel': 'Plafond annuel',
      'taux_couverture': 'Taux de couverture',
      'actif': 'Statut actif',
      
      // Champs Produit
      'nom_produit': 'Nom du produit',
      'garanties_ids': 'IDs des garanties',
      'prix_base': 'Prix de base',
      'age_min': 'Âge minimum',
      'age_max': 'Âge maximum',
      'maladie_chronique_autorisee': 'Maladies chroniques autorisées',
      'diabetique_autorise': 'Diabétiques autorisés',
      
      // Champs Pack
      'nom_pack': 'Nom du pack',
      'produits_ids': 'IDs des produits',
      'prix_mensuel': 'Prix mensuel',
      'duree_min_contrat': 'Durée minimale',
      'duree_max_contrat': 'Durée maximale',
      'niveau_couverture': 'Niveau de couverture'
    };
    
    return fieldLabels[this.activeSession.currentField] || '';
  }

  get chatbotTypeInfo() {
    if (!this.activeSession) return null;
    return this.unifiedChatbotService.getChatbotInfo(this.activeSession.chatbotType);
  }

  constructor(private unifiedChatbotService: UnifiedChatbotService) {
    this.chatState = this.unifiedChatbotService.getCurrentState();
  }

  ngOnInit(): void {
    // Écouter les changements d'état
    this.unifiedChatbotService.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.chatState = state;
        this.scrollToBottom();
      });

    // Écouter les nouvelles sessions
    this.unifiedChatbotService.onSessionCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        console.log('Nouvelle session créée:', session);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Démarre une nouvelle session avec le type de chatbot spécifié
   */
  startNewSession(chatbotType: ChatbotType): void {
    this.unifiedChatbotService.startSession(chatbotType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unifiedChatbotService.createAndActivateSession(chatbotType, response);
          this.showSessionSelector = false;
        },
        error: (error) => {
          console.error('Erreur lors du démarrage de la session:', error);
          this.handleError('Impossible de démarrer la conversation. Veuillez réessayer.');
        }
      });
  }

  /**
   * Envoie le message de l'utilisateur
   */
  sendMessage(): void {
    const message = this.userInput.trim();
    
    if (!message || !this.activeSession || this.activeSession.isLoading) {
      return;
    }

    this.userInput = '';
    this.isTyping = true;

    this.unifiedChatbotService.sendMessage(message)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isTyping = false;
          this.unifiedChatbotService.updateChatSession(response);
        },
        error: (error) => {
          this.isTyping = false;
          console.error('Erreur lors de l\'envoi du message:', error);
          this.handleError('Erreur de communication. Veuillez réessayer.');
        }
      });
  }

  /**
   * Active une session existante
   */
  activateSession(sessionId: string): void {
    this.unifiedChatbotService.activateSession(sessionId);
  }

  /**
   * Supprime une session
   */
  deleteSession(sessionId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      this.unifiedChatbotService.deleteSession(sessionId);
    }
  }

  /**
   * Réinitialise la session active
   */
  resetActiveSession(): void {
    if (this.activeSession) {
      this.unifiedChatbotService.resetSession(this.activeSession.id);
    }
  }

  /**
   * Utilise un exemple suggéré
   */
  useExample(example: string): void {
    this.userInput = example;
    this.sendMessage();
  }

  /**
   * Gère les raccourcis clavier
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Gère les erreurs
   */
  private handleError(errorMessage: string): void {
    const currentState = this.unifiedChatbotService.getCurrentState();
    this.unifiedChatbotService.chatState.next({
      ...currentState,
      globalError: errorMessage
    });
  }

  /**
   * Fait défiler vers le bas du conteneur de messages
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  /**
   * Formate le message pour l'affichage
   */
  formatMessage(content: string): string {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• (.*?)(<br>|$)/g, '<li>$1</li>')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>/g, '</li></ul>');
  }

  /**
   * Vérifie si le message est de l'utilisateur
   */
  isUserMessage(message: ChatMessage): boolean {
    return message.role === 'user';
  }

  /**
   * Vérifie si des exemples sont disponibles
   */
  hasExamples(): boolean {
    return this.currentExamples.length > 0;
  }

  /**
   * Obtient le nombre de messages non lus pour une session
   */
  getUnreadCount(session: ChatSession): number {
    if (session.id === this.activeSession?.id) return 0;
    
    // Logique pour compter les messages non lus (à implémenter selon vos besoins)
    return 0;
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    
    return date.toLocaleDateString('fr-FR');
  }
}
```

---

## 🎯 Étape 3: Template HTML Unifié

**Fichier :** `src/app/components/unified-chatbot/unified-chatbot.component.html`

```html
<div class="unified-chatbot-container">
  <!-- Header avec sélecteur de chatbot -->
  <div class="chatbot-header">
    <div class="header-content">
      <div class="chatbot-selector" (click)="showSessionSelector = !showSessionSelector">
        <div class="active-chatbot-info" *ngIf="activeSession">
          <span class="chatbot-icon">{{ chatbotTypeInfo?.icon }}</span>
          <div class="chatbot-details">
            <h4>{{ chatbotTypeInfo?.name }}</h4>
            <p>{{ chatbotTypeInfo?.description }}</p>
          </div>
          <span class="dropdown-arrow">▼</span>
        </div>
        <div class="no-active-session" *ngIf="!activeSession">
          <span class="chatbot-icon">🤖</span>
          <span>Choisir un assistant</span>
          <span class="dropdown-arrow">▼</span>
        </div>
      </div>

      <!-- Menu déroulant des chatbots -->
      <div class="chatbot-dropdown" *ngIf="showSessionSelector">
        <div class="dropdown-header">
          <h3>Choisir un assistant</h3>
          <button class="close-dropdown" (click)="showSessionSelector = false">×</button>
        </div>
        
        <div class="chatbot-options">
          <div 
            *ngFor="let chatbotType of chatState.availableChatbots"
            class="chatbot-option"
            [class.active]="activeSession?.chatbotType === chatbotType"
            (click)="startNewSession(chatbotType)"
          >
            <div class="option-icon" [style.background-color]="getChatbotInfo(chatbotType).color">
              {{ getChatbotInfo(chatbotType).icon }}
            </div>
            <div class="option-details">
              <h4>{{ getChatbotInfo(chatbotType).name }}</h4>
              <p>{{ getChatbotInfo(chatbotType).description }}</p>
            </div>
          </div>
        </div>

        <!-- Sessions existantes -->
        <div class="existing-sessions" *ngIf="chatState.sessions.length > 0">
          <h4>Conversations en cours</h4>
          <div class="session-list">
            <div 
              *ngFor="let session of chatState.sessions"
              class="session-item"
              [class.active]="activeSession?.id === session.id"
              (click)="activateSession(session.id)"
            >
              <div class="session-info">
                <span class="session-icon">{{ getChatbotInfo(session.chatbotType).icon }}</span>
                <div class="session-details">
                  <span class="session-title">{{ getChatbotInfo(session.chatbotType).name }}</span>
                  <span class="session-time">{{ formatDate(session.updatedAt) }}</span>
                </div>
                <span class="unread-badge" *ngIf="getUnreadCount(session) > 0">
                  {{ getUnreadCount(session) }}
                </span>
              </div>
              <button 
                class="delete-session-btn" 
                (click)="deleteSession(session.id, $event)"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions de la session active -->
    <div class="session-actions" *ngIf="activeSession">
      <div class="progress-container" *ngIf="!activeSession.isComplete">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="activeSession.progress"></div>
        </div>
        <span class="progress-text">{{ activeSession.progress }}%</span>
      </div>
      
      <div class="session-controls">
        <button 
          class="control-btn reset-btn" 
          (click)="resetActiveSession()"
          title="Nouvelle conversation"
        >
          🔄
        </button>
        <span class="session-status" [class.completed]="activeSession.isComplete">
          {{ activeSession.isComplete ? '✅ Terminé' : '💬 En cours' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Zone principale -->
  <div class="chat-main-area" *ngIf="activeSession">
    <!-- Messages -->
    <div class="messages-container" #messagesContainer>
      <div class="messages-list">
        <div 
          *ngFor="let message of activeSession.messages" 
          class="message"
          [class.user-message]="isUserMessage(message)"
          [class.bot-message]="!isUserMessage(message)"
        >
          <div class="message-content">
            <div class="message-avatar" *ngIf="!isUserMessage(message)">
              <span class="bot-icon">{{ chatbotTypeInfo?.icon }}</span>
            </div>
            <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
            <div class="message-time" *ngIf="message.timestamp">
              {{ formatDate(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateur d'écriture -->
      <div class="typing-indicator" *ngIf="isTyping">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <!-- Exemples suggérés -->
    <div class="examples-container" *ngIf="hasExamples() && !activeSession.isLoading">
      <div class="examples-header">
        <span class="examples-title">💡 Exemples pour {{ currentFieldLabel }}:</span>
      </div>
      <div class="examples-list">
        <button 
          *ngFor="let example of currentExamples" 
          class="example-btn"
          (click)="useExample(example)"
          [disabled]="activeSession.isLoading"
        >
          {{ example }}
        </button>
      </div>
    </div>

    <!-- Erreur globale -->
    <div class="error-container" *ngIf="chatState.globalError">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ chatState.globalError }}</span>
        <button 
          class="error-dismiss-btn" 
          (click)="unifiedChatbotService.chatState.next({...chatState, globalError: undefined})"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Erreur de session -->
    <div class="error-container" *ngIf="activeSession.error">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ activeSession.error }}</span>
        <button class="error-retry-btn" (click)="sendMessage()" *ngIf="userInput">
          Réessayer
        </button>
      </div>
    </div>

    <!-- Input -->
    <div class="input-container" *ngIf="!activeSession.isComplete">
      <div class="input-wrapper">
        <textarea 
          #userInputField
          [(ngModel)]="userInput"
          (keypress)="onKeyPress($event)"
          placeholder="Tapez votre message ici..."
          class="message-input"
          [disabled]="activeSession.isLoading"
          rows="1"
          #messageInput
        ></textarea>
        <button 
          class="send-btn"
          (click)="sendMessage()"
          [disabled]="!userInput.trim() || activeSession.isLoading"
          title="Envoyer (Enter)"
        >
          <span class="send-icon">📤</span>
        </button>
      </div>
      <div class="input-hint">
        <span *ngIf="currentFieldLabel">
          Champ actuel : <strong>{{ currentFieldLabel }}</strong>
        </span>
        <span class="keyboard-hint">
          Appuyez sur Enter pour envoyer
        </span>
      </div>
    </div>

    <!-- Message de complétion -->
    <div class="completion-container" *ngIf="activeSession.isComplete">
      <div class="completion-message">
        <span class="completion-icon">🎉</span>
        <span>Conversation terminée avec succès !</span>
        <button class="new-session-btn" (click)="resetActiveSession()">
          Nouvelle conversation
        </button>
      </div>
    </div>
  </div>

  <!-- État vide (aucune session active) -->
  <div class="empty-state" *ngIf="!activeSession">
    <div class="empty-content">
      <span class="empty-icon">🤖</span>
      <h3>Bienvenue dans l'Assistant Unifié</h3>
      <p>Choisissez un assistant pour commencer à créer des garanties, produits ou packs d'assurance.</p>
      <button class="start-btn" (click)="showSessionSelector = true">
        Commencer
      </button>
    </div>
  </div>
</div>
```

---

## 🎨 Étape 4: Styles CSS Unifiés

**Fichier :** `src/app/components/unified-chatbot/unified-chatbot.component.scss`

```scss
.unified-chatbot-container {
  display: flex;
  flex-direction: column;
  height: 700px;
  max-height: 85vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.chatbot-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .header-content {
    position: relative;
  }

  .chatbot-selector {
    padding: 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .active-chatbot-info,
    .no-active-session {
      display: flex;
      align-items: center;
      gap: 15px;

      .chatbot-icon {
        font-size: 28px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-details {
        flex: 1;

        h4 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 18px;
          font-weight: 600;
        }

        p {
          margin: 0;
          color: #7f8c8d;
          font-size: 14px;
          line-height: 1.4;
        }
      }

      .dropdown-arrow {
        color: #7f8c8d;
        font-size: 14px;
        transition: transform 0.3s ease;
      }

      &:hover .dropdown-arrow {
        transform: translateY(2px);
      }
    }
  }

  .chatbot-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #ecf0f1;

      h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 16px;
      }

      .close-dropdown {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #7f8c8d;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #ecf0f1;
        }
      }
    }

    .chatbot-options {
      padding: 10px 0;
    }

    .chatbot-option {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #f8f9fa;
      }

      &.active {
        background: #e3f2fd;
      }

      .option-icon {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: white;
      }

      .option-details {
        flex: 1;

        h4 {
          margin: 0 0 3px 0;
          color: #2c3e50;
          font-size: 15px;
          font-weight: 600;
        }

        p {
          margin: 0;
          color: #7f8c8d;
          font-size: 13px;
          line-height: 1.3;
        }
      }
    }

    .existing-sessions {
      border-top: 1px solid #ecf0f1;
      padding: 15px 20px;

      h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
        font-size: 14px;
        font-weight: 600;
      }

      .session-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .session-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #f8f9fa;
        }

        &.active {
          background: #e3f2fd;
        }

        .session-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;

          .session-icon {
            font-size: 16px;
            width: 32px;
            height: 32px;
            background: #ecf0f1;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .session-details {
            flex: 1;

            .session-title {
              display: block;
              font-weight: 500;
              color: #2c3e50;
              font-size: 14px;
            }

            .session-time {
              display: block;
              color: #7f8c8d;
              font-size: 12px;
            }
          }
        }

        .unread-badge {
          background: #e74c3c;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .delete-session-btn {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s ease;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }

  .session-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    background: rgba(255, 255, 255, 0.1);

    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;

      .progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #27ae60, #2ecc71);
          transition: width 0.3s ease;
        }
      }

      .progress-text {
        color: white;
        font-weight: 600;
        font-size: 12px;
        min-width: 35px;
      }
    }

    .session-controls {
      display: flex;
      align-items: center;
      gap: 10px;

      .control-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(180deg);
        }
      }

      .session-status {
        color: white;
        font-size: 12px;
        font-weight: 600;

        &.completed {
          color: #2ecc71;
        }
      }
    }
  }
}

.chat-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .message {
    display: flex;
    max-width: 80%;

    &.user-message {
      align-self: flex-end;
      flex-direction: row-reverse;

      .message-content {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        border-radius: 18px 18px 4px 18px;
      }
    }

    &.bot-message {
      align-self: flex-start;

      .message-content {
        background: white;
        color: #2c3e50;
        border-radius: 18px 18px 18px 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    }

    .message-content {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-width: 100%;

      .message-avatar {
        font-size: 18px;
        margin-bottom: 5px;
      }

      .message-text {
        line-height: 1.4;
        word-wrap: break-word;

        ::ng-deep ul {
          margin: 5px 0;
          padding-left: 20px;
        }

        ::ng-deep strong {
          font-weight: 600;
        }
      }

      .message-time {
        font-size: 11px;
        opacity: 0.7;
        align-self: flex-end;
      }
    }
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    background: white;
    border-radius: 18px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 80px;
    align-self: flex-start;

    .typing-dots {
      display: flex;
      gap: 4px;

      span {
        width: 8px;
        height: 8px;
        background: #3498db;
        border-radius: 50%;
        animation: typing 1.4s infinite;

        &:nth-child(2) {
          animation-delay: 0.2s;
        }

        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}

.examples-container {
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .examples-header {
    margin-bottom: 10px;

    .examples-title {
      color: #2c3e50;
      font-weight: 600;
      font-size: 14px;
    }
  }

  .examples-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .example-btn {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
      border: none;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.error-container {
  background: rgba(231, 76, 60, 0.1);
  border-left: 4px solid #e74c3c;
  padding: 15px 20px;
  margin: 0 20px;

  .error-message {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #c0392b;
    font-weight: 500;

    .error-icon {
      font-size: 18px;
    }

    .error-dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }
    }

    .error-retry-btn {
      margin-left: auto;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
  }
}

.input-container {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  .input-wrapper {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .message-input {
    flex: 1;
    border: 2px solid #ecf0f1;
    border-radius: 25px;
    padding: 12px 16px;
    font-size: 14px;
    resize: none;
    outline: none;
    transition: border-color 0.3s ease;
    min-height: 44px;
    max-height: 100px;

    &:focus:not(:disabled) {
      border-color: #3498db;
    }

    &:disabled {
      background: #ecf0f1;
      cursor: not-allowed;
    }
  }

  .send-btn {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-icon {
      font-size: 18px;
    }
  }

  .input-hint {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 12px;
    color: #7f8c8d;

    strong {
      color: #2c3e50;
    }

    .keyboard-hint {
      opacity: 0.7;
    }
  }
}

.completion-container {
  background: rgba(39, 174, 96, 0.1);
  padding: 20px;
  text-align: center;

  .completion-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #27ae60;
    font-weight: 600;

    .completion-icon {
      font-size: 24px;
    }

    .new-session-btn {
      margin-left: auto;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
      }
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);

  .empty-content {
    text-align: center;
    max-width: 400px;

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.7;
    }

    h3 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 24px;
    }

    p {
      color: #7f8c8d;
      line-height: 1.6;
      margin-bottom: 25px;
    }

    .start-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 25px;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

// Responsive
@media (max-width: 768px) {
  .unified-chatbot-container {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .message {
    max-width: 90%;
  }

  .chatbot-dropdown {
    max-height: 300px;
  }

  .examples-list {
    .example-btn {
      font-size: 11px;
      padding: 4px 8px;
    }
  }
}
```

---

## 🔧 Étape 5: Mise à Jour du Module Principal

**Fichier :** `src/app/app.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { UnifiedChatbotComponent } from './components/unified-chatbot/unified-chatbot.component';
import { UnifiedChatbotService } from './services/unified-chatbot.service';

@NgModule({
  declarations: [
    AppComponent,
    UnifiedChatbotComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    UnifiedChatbotService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## 🚀 Étape 6: Intégration dans l'App Principale

**Fichier :** `src/app/app.component.html`

```html
<div class="app-container">
  <header class="app-header">
    <h1>🏢 Vermeg Insurance - Assistant Unifié</h1>
    <p>Créez des garanties, produits et packs d'assurance avec nos assistants intelligents</p>
  </header>

  <main class="app-main">
    <app-unified-chatbot></app-unified-chatbot>
  </main>

  <footer class="app-footer">
    <p>&copy; 2024 Vermeg Insurance - Plateforme de Création d'Assurance</p>
  </footer>
</div>
```

**Fichier :** `src/app/app.component.scss`

```scss
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h1 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 28px;
  }

  p {
    margin: 0;
    color: #7f8c8d;
    font-size: 16px;
  }
}

.app-main {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.app-footer {
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}
```

---

## 🎯 Instructions d'Intégration Complètes

### **Étape 1: Créer les fichiers de base**
```bash
# Créer la structure des dossiers
mkdir -p src/app/services
mkdir -p src/app/components/unified-chatbot

# Créer les services
touch src/app/services/unified-chatbot.service.ts

# Créer le composant unifié
touch src/app/components/unified-chatbot/unified-chatbot.component.ts
touch src/app/components/unified-chatbot/unified-chatbot.component.html
touch src/app/components/unified-chatbot/unified-chatbot.component.scss
```

### **Étape 2: Copier le code**
- Copiez le contenu de chaque fichier depuis ce guide
- Assurez-vous que tous les imports sont corrects

### **Étape 3: Mettre à jour le module**
- Ajoutez `UnifiedChatbotComponent` aux déclarations
- Ajoutez `UnifiedChatbotService` aux providers
- Importez `FormsModule` et `HttpClientModule`

### **Étape 4: Configuration**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'  // URL de votre backend Flask
};
```

### **Étape 5: Tester**
```bash
# Backend
cd ai-service
python app_separated.py

# Frontend
cd frontend
ng serve

# Navigation
http://localhost:4200
```

---

## 🎨 Fonctionnalités Incluses

### ✅ **Interface Unifiée**
- **Sélecteur de chatbot** : Choix entre Garanties, Produits, Packs
- **Sessions multiples** : Gérez plusieurs conversations simultanément
- **Navigation fluide** : Basculez entre les sessions

### ✅ **Expérience Utilisateur**
- **Design adaptatif** : Couleurs et icônes par type de chatbot
- **Progression visuelle** : Barres de progression par session
- **Exemples contextuels** : Basés sur le champ actuel
- **Gestion d'erreurs** : Messages clairs et récupération

### ✅ **State Management**
- **Centralisé** : Toutes les sessions gérées globalement
- **Persistant** : Sessions conservées pendant la navigation
- **Réactif** : Mise à jour automatique de l'interface

### ✅ **Responsive Design**
- **Mobile-friendly** : Adaptation complète mobile/tablette
- **Touch optimisé** : Interface tactile intuitive
- **Performance** : Animations fluides et optimisées

---

## 🔄 Flux Utilisateur Complet

### **1. Sélection du Chatbot**
```
Utilisateur clique sur le sélecteur → Menu déroulant → Choix du type
```

### **2. Démarrage de Session**
```
API call → Session créée → Message de bienvenue → Interface active
```

### **3. Conversation**
```
Saisie utilisateur → Parsing intelligent → Validation → Réponse bot → Progression
```

### **4. Gestion Multi-Sessions**
```
Nouvelle session → Ancienne sauvegardée → Navigation entre sessions → Suppression
```

### **5. Complétion**
```
Résumé final → Confirmation → Création → Succès → Nouvelle session optionnelle
```

---

Cette intégration unifiée vous donnera une **interface complète et professionnelle** pour gérer les trois chatbots avec une expérience utilisateur moderne et intuitive ! 🎉
