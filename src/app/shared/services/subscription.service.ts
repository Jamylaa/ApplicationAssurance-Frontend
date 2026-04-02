import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../models/subscription.model';
import { API_CONFIG } from '../../core/api-config';

export interface CreateSubscriptionRequest {
  clientId: string;
  produitId: string;
  packId?: string;
  dateDebut: string | Date;
  dureeMois: number;
  primePersonnalisee?: number;
  optionsSupplementaires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly baseUrl = API_CONFIG.souscription;
  private readonly creationUrl = API_CONFIG.souscription.replace('/contrats', '/souscription/creer');

  constructor(private http: HttpClient) {}

  getAllSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.baseUrl);
  }

  getSubscriptionById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/${id}`);
  }

  getSubscriptionsByClient(clientId: string): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.baseUrl}/client/${clientId}`);
  }

  createSubscription(subscription: CreateSubscriptionRequest | Subscription): Observable<Subscription> {
    return this.http.post<Subscription>(this.creationUrl, subscription);
  }

  createFullSubscription(subscription: Subscription): Observable<Subscription> {
    const dateDebut = new Date(subscription.dateDebut);
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + (subscription.dureeMois || 0));

    const payload = {
      ...subscription,
      dateFin: dateFin.toISOString(),
      statut: 'EN_ATTENTE'
    } as Subscription;

    return this.createSubscription(payload);
  }

  renewSubscription(id: string, dureeMois: number): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/renouveler/${id}?dureeMois=${dureeMois}`, {});
  }

  terminateSubscription(id: string): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.baseUrl}/resilier/${id}`, {});
  }

  renouvelerContrat(id: string, dureeMois: number): Observable<Subscription> {
    return this.renewSubscription(id, dureeMois);
  }

  resilierContrat(id: string): Observable<Subscription> {
    return this.terminateSubscription(id);
  }

  updateSubscription(id: string, payload: Partial<Subscription>): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.baseUrl}/${id}`, payload);
  }

  deleteSubscription(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
