import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Garantie } from '../models/garantie.model';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class GarantieService {
  private baseUrl = API_CONFIG.garante;

  constructor(private http: HttpClient) {}

  getAllGaranties(): Observable<Garantie[]> {
    return this.http.get<Garantie[]>(this.baseUrl);
  }

  getGarantieById(idGarantie: string): Observable<Garantie> {
    return this.http.get<Garantie>(`${this.baseUrl}/${idGarantie}`);
  }

  createGarantie(garantie: Garantie): Observable<Garantie> {
    return this.http.post<Garantie>(this.baseUrl, garantie);
  }

  updateGarantie(idGarantie: string, garantie: Garantie): Observable<Garantie> {
    return this.http.put<Garantie>(`${this.baseUrl}/${idGarantie}`, garantie);
  }

  deleteGarantie(idGarantie: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${idGarantie}`);
  }
}
