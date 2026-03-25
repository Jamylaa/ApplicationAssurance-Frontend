import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/api-config';

export interface AdminChatMessage {
  text: string;
  sender: 'user' | 'ai';
  time: Date;
}

export interface AdminChatRequest {
  message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mode: 'creation' | 'admin';
}

export interface AdminChatResponse {
  response: string;
  collected_data?: any;
  is_complete: boolean;
  next_field?: string;
  progress?: number;
  validation_errors?: string[];
  awaiting_confirmation?: boolean;
  awaiting_correction?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminChatbotService {
  private baseUrl = API_CONFIG.ai;

  constructor(private http: HttpClient) { }

  /**
   * Envoie un message au chatbot d'administration
   */
  chat(request: AdminChatRequest): Observable<AdminChatResponse> {
    return this.http.post<AdminChatResponse>(`${this.baseUrl}/admin-chat`, request);
  }

  /**
   * Initialise une nouvelle conversation d'administration
   */
  startConversation(): Observable<AdminChatResponse> {
    return this.http.post<AdminChatResponse>(`${this.baseUrl}/admin-chat/start`, {});
  }

  /**
   * Récupère les détails d'une garantie
   */
  getGarantieDetails(garantieId: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.garante}/${garantieId}`);
  }

  /**
   * Récupère les détails d'un produit
   */
  getProduitDetails(produitId: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.produit}/${produitId}`);
  }

  /**
   * Récupère les détails d'un pack
   */
  getPackDetails(packId: string): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.pack}/${packId}`);
  }

  /**
   * Formate l'historique des messages pour l'API
   */
  formatHistory(messages: AdminChatMessage[]): Array<{role: 'user' | 'assistant', content: string}> {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  /**
   * Génère un résumé des données collectées pour confirmation
   */
  generateCreationSummary(collectedData: any, entityType: 'garantie' | 'produit' | 'pack'): string {
    if (!collectedData) return 'Aucune information collectée';
    
    let summary = `**Résumé de la création de ${entityType}**\n\n`;
    
    if (entityType === 'garantie') {
      const fields = {
        'nom_garantie': 'Nom de la garantie',
        'description': 'Description',
        'type_garantie': 'Type de garantie',
        'plafond_annuel': 'Plafond annuel (DT)',
        'taux_couverture': 'Taux de couverture (%)',
        'actif': 'Actif'
      };
      
      for (const [field, label] of Object.entries(fields)) {
        if (collectedData[field] !== undefined) {
          let value = collectedData[field];
          if (field === 'actif') value = value ? 'Oui' : 'Non';
          summary += `• **${label}** : ${value}\n`;
        }
      }
    } else if (entityType === 'produit') {
      const fields = {
        'nom_produit': 'Nom du produit',
        'description': 'Description',
        'garanties_ids': 'Garanties associées',
        'prix_base': 'Prix de base (DT)',
        'age_min': 'Âge minimum',
        'age_max': 'Âge maximum',
        'maladie_chronique_autorisee': 'Maladies chroniques autorisées',
        'diabetique_autorise': 'Diabétiques autorisés',
        'actif': 'Actif'
      };
      
      for (const [field, label] of Object.entries(fields)) {
        if (collectedData[field] !== undefined) {
          let value = collectedData[field];
          if (['maladie_chronique_autorisee', 'diabetique_autorise', 'actif'].includes(field)) {
            value = value ? 'Oui' : 'Non';
          }
          summary += `• **${label}** : ${value}\n`;
        }
      }
    } else if (entityType === 'pack') {
      const fields = {
        'nom_pack': 'Nom du pack',
        'description': 'Description',
        'produits_ids': 'Produits associés',
        'prix_mensuel': 'Prix mensuel (DT)',
        'duree_min_contrat': 'Durée minimale (mois)',
        'duree_max_contrat': 'Durée maximale (mois)',
        'niveau_couverture': 'Niveau de couverture',
        'actif': 'Actif'
      };
      
      for (const [field, label] of Object.entries(fields)) {
        if (collectedData[field] !== undefined) {
          let value = collectedData[field];
          if (field === 'actif') value = value ? 'Oui' : 'Non';
          summary += `• **${label}** : ${value}\n`;
        }
      }
    }
    
    return summary;
  }
}
