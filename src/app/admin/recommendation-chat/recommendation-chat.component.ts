import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { RecommendationChatbotService, ChatMessage } from '../../shared/services/recommendation-chatbot.service';

@Component({
  selector: 'app-recommendation-chat',
  templateUrl: './recommendation-chat.component.html',
  styleUrl: './recommendation-chat.component.css'
})
export class RecommendationChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  loading: boolean = false;
  progress: number = 0;
  isComplete: boolean = false;
  collectedData: any = {};
  recommendations: any[] = [];
  showSummary: boolean = false;
  breadcrumbItems = [{ label: 'Chat Recommandation', link: '/admin/recommendation-chat' }];
  constructor(private recommendationService: RecommendationChatbotService) {}
  ngOnInit() { this.startConversation();}
  startConversation() {
    this.loading = true;
    this.recommendationService.startConversation().subscribe({
      next: (res) => {
        this.messages.push({ 
          text: res.response, 
          sender: 'ai', 
          time: new Date() 
        });
        this.progress = res.progress || 0;
        this.loading = false;
      },
      error: () => {
        this.messages.push({ 
          text: 'Bonjour ! Je suis votre assistant d\'assurance santé. Je vais vous poser quelques questions pour trouver le pack d\'assurance le mieux adapté à vos besoins.\n\nPour commencer, pourriez-vous me donner votre âge ?', 
          sender: 'ai', 
          time: new Date() 
        });
        this.loading = false;
      }
    });
  }
  ngAfterViewChecked() {   this.scrollToBottom(); } //scroller automatiquement vers le bas
  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage(text?: string): void {
    const messageToSend = text || this.userInput;
    if (!messageToSend.trim() || this.loading) return;

    const userMsg: ChatMessage = { 
      text: messageToSend, 
      sender: 'user', 
      time: new Date() 
    };
    this.messages.push(userMsg);
    
    if (!text) this.userInput = '';
    this.loading = true;

    const history = this.recommendationService.formatHistory(this.messages);

    this.recommendationService.chat({ 
      message: messageToSend,
      conversation_history: history
    }).subscribe({
      next: (res) => {
        this.messages.push({ 
          text: res.response, 
          sender: 'ai', 
          time: new Date() 
        });
        this.progress = res.progress || 0;
        this.collectedData = res.collected_data || {};
        this.isComplete = res.is_complete || false;
        
        if (res.recommendations) {
          this.recommendations = res.recommendations.scoredPacks || [];
        }
        
        this.loading = false;
      },
      error: () => {
        this.messages.push({ 
          text: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer.', 
          sender: 'ai', 
          time: new Date() 
        });
        this.loading = false;
      }
    });
  }

  getProfileSummary(): string {
    return this.recommendationService.generateProfileSummary(this.collectedData);
  }

  viewPackDetails(packId: string): void {
    this.recommendationService.getPackDetails(packId).subscribe({
      next: (pack) => {
        const packDetails = `**Détails du pack ${pack.nomPack}**\n\n` +
          `• Description : ${pack.description}\n` +
          `• Prix mensuel : ${pack.prixMensuel} DT\n` +
          `• Durée : ${pack.dureeMinContrat} - ${pack.dureeMaxContrat} mois\n` +
          `• Niveau : ${pack.niveauCouverture}\n` +
          `• Actif : ${pack.actif ? 'Oui' : 'Non'}`;
        
        this.messages.push({ 
          text: packDetails, 
          sender: 'ai', 
          time: new Date() 
        });
      },
      error: () => {
        this.messages.push({ 
          text: 'Impossible de récupérer les détails de ce pack.', 
          sender: 'ai', 
          time: new Date() 
        });
      }
    });
  }

  resetConversation(): void {
    this.messages = [];
    this.progress = 0;
    this.isComplete = false;
    this.collectedData = {};
    this.recommendations = [];
    this.showSummary = false;
    this.startConversation();
  }

  formatMessage(text: string): string {
    // Convertir les retours à la ligne en <br>
    let formatted = text.replace(/\n/g, '<br>');
    
    // Convertir le markdown **bold** en <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convertir les listes à puces
    formatted = formatted.replace(/^• (.*)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return formatted;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  get hasCollectedData(): boolean {
    return !!this.collectedData && Object.keys(this.collectedData).length > 0;
  }
}
