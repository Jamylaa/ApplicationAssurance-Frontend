import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  time: Date;
}

export interface ChatRequest {
  message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  client_id?: string;
}

export interface ChatResponse {
  response: string;
  collected_data?: any;
  is_complete: boolean;
  next_field?: string;
  progress?: number;
  recommendations?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationChatbotService {
  private baseUrl = API_CONFIG.ai;

  constructor(private http: HttpClient) { }

  /**
   * Envoie un message au chatbot de recommandation
   */
  chat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/recommendation-chat`, request);
  }

  /**
   * Initialise une nouvelle conversation de recommandation
   */
  startConversation(clientId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/recommendation-chat/start`, {
      client_id: clientId
    });
  }

  /**
   * Récupère les détails d'un pack recommandé
   */
  getPackDetails(packId: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.pack}/${packId}`);
  }

  /**
   * Formate l'historique des messages pour l'API
   */
  formatHistory(messages: ChatMessage[]): Array<{role: 'user' | 'assistant', content: string}> {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  /**
   * Génère un résumé du profil utilisateur
   */
  generateProfileSummary(collectedData: any): string {
    if (!collectedData) return 'Aucune information collectée';
    
    let summary = '**Votre profil d\'assurance**\n\n';
    
    const fieldLabels: { [key: string]: string } = {
      'age': 'Âge',
      'sexe': 'Sexe',
      'profession': 'Profession',
      'situation_familiale': 'Situation familiale',
      'maladie_chronique': 'Maladies chroniques',
      'diabetique': 'Diabétique',
      'tension': 'Tension artérielle',
      'maladies_legeres': 'Maladies légères',
      'nombre_beneficiaires': 'Nombre de bénéficiaires',
      'duree_contrat_souhaitee': 'Durée de contrat souhaitée',
      'budget_mensuel': 'Budget mensuel'
    };
    
    for (const [field, label] of Object.entries(fieldLabels)) {
      if (collectedData[field] !== undefined) {
        let value = collectedData[field];
        if (['maladie_chronique', 'diabetique', 'tension', 'maladies_legeres'].includes(field)) {
          value = value ? 'Oui' : 'Non';
        }
        summary += `• **${label}** : ${value}\n`;
      }
    }
    
    return summary;
  }
}
