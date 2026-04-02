# Documentation Complete - Separation des Chatbots

## Objectif
Separer le chatbot de recommandation du chatbot d'administration pour obtenir une architecture plus modulaire, maintenable et evolutive.

## Changements Backend

### 1) Nouveau fichier `ai-service/chatbot/recommendation_chatbot.py`
- Classe `RecommendationChatbot` dediee aux recommandations.
- Extraction NLP des donnees client (age, sexe, profession, etc.).
- Gestion des champs conditionnels (diabete, tension si maladie chronique).
- Calcul de progression de conversation.
- Appel du service de recommandation (port `9095`).
- Generation du resume profil utilisateur.

Methodes principales:

```python
class RecommendationChatbot:
    def __init__(self)
    def get_welcome_message(self) -> dict
    def process_message(self, message: str, history: list, client_id: str = "") -> dict
    def _extract_collected_data(self, history: list, fields: dict) -> dict
    def _calculate_progress(self, collected_data: dict, fields: dict) -> int
    def _finalize_recommendation(self, collected_data: dict, client_id: str = "") -> dict
    def get_user_profile_summary(self, collected_data: dict) -> str
```

### 2) Fichier existant `ai-service/chatbot/chatbot_engine.py`
- Aucune modification: le chatbot d'administration reste intact.
- Fonctionnalites conservees:
  - Mode creation (garantie, produit, pack)
  - Mode recommandation (compatibilite)
  - Validation stricte et confirmation
  - Gestion des entites administratives

### 3) Nouveau fichier `ai-service/app_separated.py`
- Serveur Flask avec endpoints dedies.
- Initialisation des 2 chatbots (recommendation + admin).
- CORS active pour Angular.
- Gestion centralisee des erreurs.

Endpoints API:

```python
# Recommendation
@app.route('/api/recommendation-chat/start', methods=['POST'])
@app.route('/api/recommendation-chat', methods=['POST'])

# Administration
@app.route('/api/admin-chat/start', methods=['POST'])
@app.route('/api/admin-chat', methods=['POST'])

# Healthcheck
@app.route('/api/health', methods=['GET'])
```

### 4) Tests backend
Nouveau fichier `ai-service/test_integration.py`:
- Tests d'integration API
- Validation endpoints
- Simulation de conversations completes
- Test de sante

## Changements Frontend

### 1) Services Angular

#### A) `frontend/src/app/shared/services/recommendation-chatbot.service.ts`
Interfaces:

```typescript
export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  time: Date;
}

export interface ChatRequest {
  message: string;
  conversation_history: Array<{role: 'user' | 'assistant', content: string}>;
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
```

Methodes:

```typescript
export class RecommendationChatbotService {
  chat(request: ChatRequest): Observable<ChatResponse>
  startConversation(clientId?: string): Observable<ChatResponse>
  getPackDetails(packId: string): Observable<any>
  formatHistory(messages: ChatMessage[]): Array<{role: 'user' | 'assistant', content: string}>
  generateProfileSummary(collectedData: any): string
}
```

#### B) `frontend/src/app/shared/services/admin-chatbot.service.ts`
Interfaces admin:

```typescript
export interface AdminChatMessage {
  text: string;
  sender: 'user' | 'ai';
  time: Date;
}

export interface AdminChatRequest {
  message: string;
  conversation_history: Array<{role: 'user' | 'assistant', content: string}>;
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
```

### 2) Composants client

#### A) `frontend/src/app/client/chatbot/chatbot.component.ts`
Mises a jour:
- Injection `RecommendationChatbotService` (au lieu de `AiService`)
- Nouvelles proprietes:
  - `progress`
  - `isComplete`
  - `collectedData`
  - `recommendations`
  - `showSummary`
- Nouvelles methodes:
  - `startConversation()`
  - `getProfileSummary()`
  - `viewPackDetails()`
  - `resetConversation()`
  - `formatMessage()`
  - `hasCollectedData` (getter)

UI ajoutee:
- Barre de progression
- Resume de profil pliable
- Liste des packs recommandes
- Boutons de details
- Bouton de reset

#### B) `frontend/src/app/client/chatbot/chatbot.component.html`
Nouveaux blocs:
- Progression
- Resume profil
- Recommandations
- Actions finales conditionnelles (`isComplete || hasCollectedData`)

#### C) `frontend/src/app/client/chatbot/chatbot.component.css`
Nouveaux styles:
- Progress bar animee
- Resume/accordeon
- Cards recommandations
- Typing indicator
- Responsive mobile

### 3) Composants administration

#### A) `frontend/src/app/admin/recommendation-chat/recommendation-chat.component.ts`
- Nouveau composant recommendation cote admin.
- Breadcrumb: `Chat Recommandation`.
- Labels adaptes admin (`Profil Client`, `Packs recommandes pour ce client`).
- Getter `hasCollectedData`.

#### B) `frontend/src/app/admin/recommendation-chat/recommendation-chat.component.html`
- Entete dediee recommendation.
- UI adaptee au contexte admin.

#### C) `frontend/src/app/admin/recommendation-chat/recommendation-chat.component.css`
- Palette admin (bleu)
- Bordures/ombres cohentes back-office
- Responsive admin

#### D) `frontend/src/app/admin/admin-chat/admin-chat.component.ts`
- Injection `AdminChatbotService`.
- Types admin (`AdminChatMessage`, `AdminChatRequest`).
- Mode explicite `'creation'`.
- Gestion des choix suggeres dynamiques.

### 4) Routing et modules

#### A) `frontend/src/app/admin/admin-routing.module.ts`
Routes:

```typescript
{ path: 'chat', component: AdminChatComponent, data: { breadcrumb: 'Chat Creation' } },
{ path: 'recommendation-chat', component: RecommendationChatComponent, data: { breadcrumb: 'Chat Recommandation' } },
```

#### B) `frontend/src/app/admin/admin.module.ts`
Declaration:

```typescript
import { RecommendationChatComponent } from './recommendation-chat/recommendation-chat.component';

@NgModule({
  declarations: [
    RecommendationChatComponent,
  ]
})
```

## Configuration et deploiement

### 1) Variables d'environnement
Backend:

```bash
RECOMMENDATION_SERVICE_URL=http://localhost:9095
PRODUCT_SERVICE_URL=http://localhost:9093
PORT=5000
DEBUG=False
```

Frontend (`api-config.ts`):

```typescript
export const API_CONFIG = {
  ai: 'http://localhost:5000/api',
  recommendation: 'http://localhost:9095/api/recommendations',
};
```

### 2) Demarrage
Backend:

```bash
cd ai-service
python app_separated.py
```

Frontend:

```bash
cd frontend
ng serve
```

### 3) Tests
Backend:

```bash
cd ai-service
python test_integration.py
```

Frontend:

```bash
cd frontend
ng test
```

## Architecture cible

Backend:

```text
ai-service/
├── app_separated.py
├── test_integration.py
├── API_ENDPOINTS.md
├── CHATBOT_ARCHITECTURE.md
└── chatbot/
    ├── recommendation_chatbot.py
    └── chatbot_engine.py
```

Frontend:

```text
frontend/src/app/
├── shared/services/
│   ├── recommendation-chatbot.service.ts
│   └── admin-chatbot.service.ts
├── client/
│   └── chatbot/
└── admin/
    ├── admin-chat/
    ├── recommendation-chat/
    ├── admin-routing.module.ts
    └── admin.module.ts
```

## Avantages

### 1) Maintenabilite
- Responsibilities claires
- Tests isoles
- Debug simplifie

### 2) Performance
- Services dedies
- Chargement mieux cible
- Scalabilite

### 3) Securite
- Separation des acces
- Isolation des donnees
- Surface d'attaque reduite

### 4) Evolutivite
- Ajout simple de nouveaux chatbots
- Deploiement modulaire
- Tests paralleles

## Utilisation

URLs:
- Client: `/client/chatbot`
- Admin creation: `/admin/chat`
- Admin recommandation: `/admin/recommendation-chat`

Flux:
1. L'admin cree les entites via `/admin/chat`.
2. Le moteur de recommandation exploite ces entites.
3. Le client obtient ses recommandations via `/client/chatbot`.
4. L'admin peut tester via `/admin/recommendation-chat`.

## Checklist de validation

Backend:
- [ ] Service actif sur `:5000`
- [ ] `/api/health` OK
- [ ] Recommendation chatbot OK
- [ ] Admin chatbot OK
- [ ] Tests d'integration OK

Frontend:
- [ ] Build Angular OK
- [ ] Routes OK
- [ ] Services injectes correctement
- [ ] Responsive OK
- [ ] Tests unitaires OK

Integration:
- [ ] Communication frontend-backend OK
- [ ] Donnees echangees correctement
- [ ] Gestion d'erreurs propre
- [ ] UX fluide

