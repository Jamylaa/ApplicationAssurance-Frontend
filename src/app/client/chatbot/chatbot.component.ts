import { Component, OnInit } from '@angular/core';
import { RecommendationChatbotService, ChatMessage } from '../../shared/services/recommendation-chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit {
  messages: ChatMessage[] = [];
  currentMessage: string = '';
  loading: boolean = false;
  progress: number = 0;
  isComplete: boolean = false;
  collectedData: any = {};
  recommendations: any[] = [];
  showSummary: boolean = false;
  constructor(private recommendationService: RecommendationChatbotService) {}
  ngOnInit() { this.startConversation(); }

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

  sendMessage() {
    if (this.currentMessage.trim() && !this.loading) {
      const userText = this.currentMessage;
      const userMsg: ChatMessage = { text: userText, sender: 'user', time: new Date() };
      this.messages.push(userMsg);
      this.currentMessage = '';
      this.loading = true;

      const history = this.recommendationService.formatHistory(this.messages);

      this.recommendationService.chat({ 
        message: userText,
        conversation_history: history
      }).subscribe({
        next: (res) => {
          this.messages.push({ text: res.response, sender: 'ai', time: new Date() });
          this.progress = res.progress || 0;
          this.collectedData = res.collected_data || {};
          this.isComplete = res.is_complete || false;
          
          if (res.recommendations) {
            this.recommendations = res.recommendations.scoredPacks || [];  }  
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
  }
  getProfileSummary() {
    return this.recommendationService.generateProfileSummary(this.collectedData); }

  viewPackDetails(packId: string) {
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
  resetConversation() {
    this.messages = [];
    this.progress = 0;
    this.isComplete = false;
    this.collectedData = {};
    this.recommendations = [];
    this.startConversation();
  }
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  get hasCollectedData(): boolean {
    return !!this.collectedData && Object.keys(this.collectedData).length > 0;
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