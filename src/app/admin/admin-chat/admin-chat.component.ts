import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AdminChatbotService, AdminChatMessage } from '../../shared/services/admin-chatbot.service';

@Component({
  selector: 'app-admin-chat',
  templateUrl: './admin-chat.component.html',
  styleUrl: './admin-chat.component.css'
})
export class AdminChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: AdminChatMessage[] = [];
  userInput: string = '';
  loading: boolean = false;
  progress: number = 0;
  isComplete: boolean = false;
  suggestedChoices: string[] = ['Garantie', 'Produit', 'Pack'];
  breadcrumbItems = [{ label: 'Assistant IA', link: '/admin/chat' }];
  collectedData: any = {};
  currentEntityType: string = '';
  showSummary: boolean = false;

  constructor(private adminChatbotService: AdminChatbotService) {}

  ngOnInit(): void {
    this.startConversation();
  }

  startConversation() {
    this.adminChatbotService.startConversation().subscribe({
      next: (res) => {
        this.messages.push({ 
          text: res.response, 
          sender: 'ai', 
          time: new Date() 
        });
        this.progress = res.progress || 0;
      },
      error: () => {
        this.messages.push({
          text: ' Bonjour Administrateur ! Je suis votre assistant de création. Que souhaitez-vous créer aujourd\'hui ?',
          sender: 'ai',
          time: new Date()
        });
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage(text?: string): void {
    const messageToSend = text || this.userInput;
    if (!messageToSend.trim() || this.loading) return;

    const userMsg: AdminChatMessage = { 
      text: messageToSend, 
      sender: 'user', 
      time: new Date() 
    };
    this.messages.push(userMsg);
    
    if (!text) this.userInput = '';
    this.loading = true;
    this.suggestedChoices = []; // Clear choices while loading

    const history = this.adminChatbotService.formatHistory(this.messages);

    this.adminChatbotService.chat({
      message: messageToSend,
      conversation_history: history,
      mode: 'creation'
    }).subscribe({
      next: (res) => {
        this.messages.push({ 
          text: res.response, 
          sender: 'ai', 
          time: new Date() 
        });
        this.progress = res.progress || 0;
        this.isComplete = res.is_complete || false;
        this.collectedData = res.collected_data || {};
        
        // Déterminer le type d'entité en cours de création
        if (this.collectedData.admin_intent) {
          this.currentEntityType = this.collectedData.admin_intent.toLowerCase();
        }

        // Handle suggested choices if backend provides them or if we can infer them
        if (res.response.includes('(Garantie / Produit / Pack)')) {
          this.suggestedChoices = ['Garantie', 'Produit', 'Pack'];
        } else if (res.response.toLowerCase().includes('oui / non') || res.response.toLowerCase().includes('oui/non')) {
          this.suggestedChoices = ['Oui', 'Non'];
        } else if (res.response.includes('(BASIC / PREMIUM / GOLD)')) {
          this.suggestedChoices = ['BASIC', 'PREMIUM', 'GOLD'];
        } else if (res.response.includes('MALADIE_LEGERE') || res.response.includes('Type (')) {
          this.suggestedChoices = ["MALADIE_LEGERE", "MALADIE_CHRONIQUE", "OPHTALMOLOGIE", "DENTAIRE", "HOSPITALISATION", "MATERNITE"];
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('AI Error', err);
        this.messages.push({ 
          text: 'Désolé, une erreur est survenue lors de la communication avec l\'IA.', 
          sender: 'ai',
          time: new Date()
        });
        this.loading = false;
      }
    });
  }

  selectChoice(choice: string): void {
    this.sendMessage(choice);
  }

  resetChat(): void {
    this.messages = [];
    this.progress = 0;
    this.isComplete = false;
    this.suggestedChoices = ['Garantie', 'Produit', 'Pack'];
    this.collectedData = {};
    this.currentEntityType = '';
    this.showSummary = false;
    this.startConversation();
  }

  getCreationSummary(): string {
    if (!this.currentEntityType) return '';
    return this.adminChatbotService.generateCreationSummary(this.collectedData, this.currentEntityType as any);
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
}
