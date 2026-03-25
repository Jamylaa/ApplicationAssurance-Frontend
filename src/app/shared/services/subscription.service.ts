import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../models/subscription.model';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private baseUrl = API_CONFIG.souscription;

  constructor(private http: HttpClient) {}

  getAllSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(this.baseUrl); }

  getSubscriptionById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/${id}`); }

  // Compatibilité avec endpoint /api/souscription/creer
  createSubscription(subscription: Subscription): Observable<Subscription> {
    const target = this.baseUrl.replace('/contrats', '/souscription/creer');
    return this.http.post<Subscription>(target, subscription); }

  createFullSubscription(subscription: Subscription): Observable<Subscription> {
    // Calcul de dateFin côté front-end pour service simple
    const dateDebut = new Date(subscription.dateDebut);
    const dateFin = new Date(dateDebut);
    dateFin.setMonth(dateFin.getMonth() + (subscription.dureeMois || 0));

    const payload = {
      ...subscription,
      dateFin: dateFin.toISOString(),
      statut: 'EN_ATTENTE'
    } as Subscription;

    return this.createSubscription(payload); }

  updateSubscription(id: string, payload: Partial<Subscription>): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.baseUrl}/${id}`, payload); }

  deleteSubscription(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`); }
}