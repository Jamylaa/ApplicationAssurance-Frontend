import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../models/produit.model';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = 'http://localhost:9093/api/produits';

  constructor(private http: HttpClient) {}

  getAllProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}`); }

  getProduitById(idProduit: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${idProduit}`); }

  createProduit(produit: Produit): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, produit); }

  updateProduit(idProduit: string, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/${idProduit}`, produit); }

  deleteProduit(idProduit: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idProduit}`); }

}