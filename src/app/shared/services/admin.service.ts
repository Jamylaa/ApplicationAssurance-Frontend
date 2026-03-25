import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Admin } from '../models/admin.model';
import { API_CONFIG } from '../../core/api-config';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://localhost:9092/api/admins';;

  constructor(private http: HttpClient) {}

  getAllAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(`${this.baseUrl}/getAllAdmins`);
  }

  getAdminById(idUser: string): Observable<Admin> {
    return this.http.get<Admin>(`${this.baseUrl}/getAdminById/${idUser}`);
  }

  createAdmin(admin: Admin): Observable<Admin> {
    return this.http.post<Admin>(`${this.baseUrl}/createAdmin`, admin);
  }

  updateAdmin(idUser: string, admin: Admin): Observable<Admin> {
    // Current backend uses @RequestParam for update, adhering to that
    const params = {
      userName: admin.userName,
      email: admin.email,
      password: admin.password || '',
      phone: admin.phone.toString(),
      departement: admin.departement
    };
    return this.http.put<Admin>(`${this.baseUrl}/${idUser}`, null, { params });
  }

  deleteAdmin(idUser: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${idUser}`);
  }
}
