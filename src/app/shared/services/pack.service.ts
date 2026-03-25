import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pack } from '../models/pack.model';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class PackService {
  private baseUrl = API_CONFIG.pack;

  constructor(private http: HttpClient) {}

  getAllPacks(): Observable<Pack[]> {
    return this.http.get<Pack[]>(this.baseUrl); }

  getPackById(idPack: string): Observable<Pack> {
    return this.http.get<Pack>(`${this.baseUrl}/${idPack}`);}

  createPack(pack: Pack): Observable<Pack> {
    return this.http.post<Pack>(this.baseUrl, pack); }

  updatePack(idPack: string, pack: Pack): Observable<Pack> {
    return this.http.put<Pack>(`${this.baseUrl}/${idPack}`, pack); }

  deletePack(idPack: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${idPack}`);  }
}