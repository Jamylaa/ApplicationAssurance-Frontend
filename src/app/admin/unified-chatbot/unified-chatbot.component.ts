import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  ChatSession,
  ChatbotType,
  UnifiedChatMessage,
  UnifiedChatState,
  UnifiedChatbotService
} from '../../shared/services/unified-chatbot.service';

@Component({
  selector: 'app-unified-chatbot',
  templateUrl: './unified-chatbot.component.html',
  styleUrl: './unified-chatbot.component.css'
})
export class UnifiedChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  chatState: UnifiedChatState;
  userInput = '';
  showSelector = false;
  isTyping = false;
  breadcrumbItems = [{ label: 'Assistant Unifie', link: '/admin/unified-chat' }];

  readonly ChatbotType = ChatbotType;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(public unifiedChatbotService: UnifiedChatbotService) {
    this.chatState = this.unifiedChatbotService.getCurrentState();
  }

  get activeSession(): ChatSession | null {
    return this.chatState.activeSession;
  }

  get currentExamples(): string[] {
    return this.activeSession?.examples || [];
  }

  get currentFieldLabel(): string {
    const labels: Record<string, string> = {
      nom_garantie: 'Nom garantie',
      type_garantie: 'Type garantie',
      plafond_annuel: 'Plafond annuel',
      taux_couverture: 'Taux couverture',
      nom_produit: 'Nom produit',
      garanties_ids: 'IDs garanties',
      prix_base: 'Prix base',
      nom_pack: 'Nom pack',
      produits_ids: 'IDs produits',
      prix_mensuel: 'Prix mensuel',
      niveau_couverture: 'Niveau couverture',
      actif: 'Actif'
    };
    return labels[this.activeSession?.currentField || ''] || '';
  }

  ngOnInit(): void {
    this.unifiedChatbotService.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.chatState = state;
        this.scrollToBottom();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startNewSession(type: ChatbotType): void {
    this.unifiedChatbotService.startSession(type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unifiedChatbotService.createAndActivateSession(type, response);
          this.showSelector = false;
        },
        error: () => this.unifiedChatbotService.setGlobalError('Impossible de demarrer la session.')
      });
  }

  sendMessage(): void {
    const message = this.userInput.trim();
    if (!message || !this.activeSession || this.activeSession.isLoading) return;

    this.userInput = '';
    this.isTyping = true;

    this.unifiedChatbotService.sendMessage(message)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isTyping = false;
          this.unifiedChatbotService.updateChatSession(response);
        },
        error: () => {
          this.isTyping = false;
          this.unifiedChatbotService.setGlobalError('Erreur de communication avec le service IA.');
        }
      });
  }

  activateSession(sessionId: string): void {
    this.unifiedChatbotService.activateSession(sessionId);
    this.showSelector = false;
  }

  deleteSession(sessionId: string, event: Event): void {
    event.stopPropagation();
    this.unifiedChatbotService.deleteSession(sessionId);
  }

  resetActiveSession(): void {
    if (!this.activeSession) return;
    const type = this.activeSession.chatbotType;
    this.unifiedChatbotService.resetSession(this.activeSession.id);
    this.startNewSession(type);
  }

  useExample(example: string): void {
    this.userInput = example;
    this.sendMessage();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getInfo(type: ChatbotType): { name: string; icon: string; color: string; description: string } {
    return this.unifiedChatbotService.getChatbotInfo(type);
  }

  formatMessage(content: string): string {
    let formatted = content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    formatted = formatted.replace(/(?:^|<br>)[-*•]\s(.+?)(?=<br>|$)/g, '<br><li>$1</li>');
    formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    return formatted.replace(/^<br>/, '');
  }

  isUserMessage(message: UnifiedChatMessage): boolean {
    return message.role === 'user';
  }

  hasExamples(): boolean {
    return this.currentExamples.length > 0;
  }

  clearGlobalError(): void {
    this.unifiedChatbotService.setGlobalError(undefined);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 80);
  }
}

