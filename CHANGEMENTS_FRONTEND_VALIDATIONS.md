# Changements Frontend - Intégration Validations

## 📋 Vue d'ensemble

Ce document présente les modifications nécessaires dans le frontend Angular pour intégrer les nouvelles validations du backend GestionUser.

## 📁 Fichiers à modifier/créer

### 1. **Client Service** - Mise à jour des endpoints

**Fichier** : `src/app/shared/services/client.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Client, ClientDTO } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:9091/api';
  private baseUrlV2 = 'http://localhost:9091/api/clients-v2';

  constructor(private http: HttpClient) {}

  // Ancien endpoint (gardé pour compatibilité)
  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/clients`);
  }

  // Nouveaux endpoints avec validation
  getAllClientsV2(): Observable<ClientDTO[]> {
    return this.http.get<ClientDTO[]>(this.baseUrlV2).pipe(
      catchError(this.handleError)
    );
  }

  getClientById(id: string): Observable<ClientDTO> {
    return this.http.get<ClientDTO>(`${this.baseUrlV2}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createClient(client: ClientDTO): Observable<ClientDTO> {
    return this.http.post<ClientDTO>(this.baseUrlV2, client).pipe(
      catchError(this.handleError)
    );
  }

  updateClient(id: string, client: ClientDTO): Observable<ClientDTO> {
    return this.http.put<ClientDTO>(`${this.baseUrlV2}/${id}`, client).pipe(
      catchError(this.handleError)
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrlV2}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Nouveaux endpoints de validation
  validateUsername(username: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrlV2}/validate-username`, null, {
      params: { username }
    }).pipe(
      catchError(this.handleError)
    );
  }

  validatePassword(password: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrlV2}/validate-password`, null, {
      params: { password }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(error.message || 'Server error');
  }
}
```

### 2. **Client Model** - Ajout du DTO

**Fichier** : `src/app/shared/models/client.model.ts`

```typescript
export interface Client {
  idUser?: string;
  userName: string;
  email: string;
  password: string;
  phone: number;
  role?: string;
  actif?: boolean;
  dateCreation?: Date;
  age?: number;
  sexe?: string;
  profession?: string;
  situationFamiliale?: string;
  maladieChronique?: boolean;
  diabetique?: boolean;
  tension?: boolean;
  nombreBeneficiaires?: number;
}

export interface ClientDTO {
  userName: string;
  email: string;
  password: string;
  phone: number;
  age?: number;
  sexe?: string;
  profession?: string;
  situationFamiliale?: string;
  maladieChronique?: boolean;
  diabetique?: boolean;
  tension?: boolean;
  nombreBeneficiaires?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}
```

### 3. **Validation Service** - Nouveau service de validation

**Fichier** : `src/app/shared/services/validation.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { ClientService } from './client.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  constructor(private clientService: ClientService) {}

  // Validation du username en temps réel
  validateUsername(username: string): Observable<{isValid: boolean, message: string}> {
    if (!username) {
      return of({isValid: false, message: 'Le username ne peut pas être vide'});
    }

    if (username.length < 3) {
      return of({isValid: false, message: 'Le username doit contenir au moins 3 caractères'});
    }

    if (username.length > 30) {
      return of({isValid: false, message: 'Le username ne peut pas dépasser 30 caractères'});
    }

    // Validation du format (un seul mot ou mots séparés par des tirets)
    const usernamePattern = /^[a-zA-Z]+(-[a-zA-Z]+)*$/;
    if (!usernamePattern.test(username)) {
      return of({
        isValid: false, 
        message: 'Le username doit être un seul mot ou des mots séparés uniquement par des tirets (ex: jean, jean-marc)'
      });
    }

    // Validation côté serveur
    return this.clientService.validateUsername(username).pipe(
      map(response => ({isValid: true, message: 'Username valide'})),
      delay(500) // Simuler un délai réseau
    );
  }

  // Validation du mot de passe en temps réel
  validatePassword(password: string): Observable<{isValid: boolean, message: string}> {
    if (!password) {
      return of({isValid: false, message: 'Le mot de passe ne peut pas être vide'});
    }

    if (password.length < 6) {
      return of({isValid: false, message: 'Le mot de passe doit contenir au moins 6 caractères'});
    }

    if (password.includes(' ')) {
      return of({isValid: false, message: 'Le mot de passe ne peut pas contenir d\'espaces'});
    }

    if (!/[a-zA-Z]/.test(password)) {
      return of({isValid: false, message: 'Le mot de passe doit contenir au moins une lettre'});
    }

    if (!/[0-9]/.test(password)) {
      return of({isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre'});
    }

    return of({isValid: true, message: 'Mot de passe valide'});
  }

  // Validation de l'email
  validateEmail(email: string): {isValid: boolean, message: string} {
    if (!email) {
      return {isValid: false, message: 'L\'email ne peut pas être vide'};
    }

    const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(email)) {
      return {isValid: false, message: 'L\'email n\'a pas un format valide'};
    }

    return {isValid: true, message: 'Email valide'};
  }

  // Validation du téléphone
  validatePhone(phone: number): {isValid: boolean, message: string} {
    if (!phone || phone === 0) {
      return {isValid: false, message: 'Le téléphone ne peut pas être vide'};
    }

    const phoneStr = phone.toString();
    
    if (phoneStr.length !== 8) {
      return {isValid: false, message: 'Le numéro de téléphone doit contenir 8 chiffres'};
    }

    if (!/^[2-9]\d{7}$/.test(phoneStr)) {
      return {isValid: false, message: 'Le numéro doit commencer par 2, 3, 4, 5, 6, 7, 8 ou 9'};
    }

    return {isValid: true, message: 'Téléphone valide'};
  }
}
```

### 4. **Component Client Form** - Mise à jour du formulaire

**Fichier** : `src/app/admin/client-form/client-form.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClientService } from '../../shared/services/client.service';
import { ValidationService } from '../../shared/services/validation.service';
import { ClientDTO } from '../../shared/models/client.model';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent implements OnInit, OnDestroy {
  clientForm: FormGroup;
  isEditing = false;
  clientId: string;
  loading = false;
  errorMessage: string;
  successMessage: string;

  // Messages de validation
  usernameValidation: {isValid: boolean, message: string} = {isValid: true, message: ''};
  passwordValidation: {isValid: boolean, message: string} = {isValid: true, message: ''};
  emailValidation: {isValid: boolean, message: string} = {isValid: true, message: ''};
  phoneValidation: {isValid: boolean, message: string} = {isValid: true, message: ''};

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private validationService: ValidationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupRealTimeValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [0, [Validators.required, Validators.min(20000000), Validators.max(99999999)]],
      age: [null],
      sexe: [''],
      profession: [''],
      situationFamiliale: [''],
      maladieChronique: [false],
      diabetique: [false],
      tension: [false],
      nombreBeneficiaires: [1]
    });
  }

  private setupRealTimeValidation(): void {
    // Validation du username en temps réel
    this.clientForm.get('userName')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value) {
          this.validationService.validateUsername(value)
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
              this.usernameValidation = result;
            });
        }
      });

    // Validation du mot de passe en temps réel
    this.clientForm.get('password')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value) {
          const result = this.validationService.validatePassword(value);
          this.passwordValidation = result;
        }
      });

    // Validation de l'email en temps réel
    this.clientForm.get('email')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value) {
          const result = this.validationService.validateEmail(value);
          this.emailValidation = result;
        }
      });

    // Validation du téléphone en temps réel
    this.clientForm.get('phone')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value && value !== 0) {
          const result = this.validationService.validatePhone(value);
          this.phoneValidation = result;
        }
      });
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    // Vérifications finales de validation
    if (!this.usernameValidation.isValid || !this.passwordValidation.isValid || 
        !this.emailValidation.isValid || !this.phoneValidation.isValid) {
      this.errorMessage = 'Veuillez corriger les erreurs de validation avant de soumettre';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const clientDTO: ClientDTO = this.clientForm.value;

    const operation = this.isEditing 
      ? this.clientService.updateClient(this.clientId, clientDTO)
      : this.clientService.createClient(clientDTO);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Client mis à jour avec succès' : 'Client créé avec succès';
        setTimeout(() => {
          this.router.navigate(['/admin/clients']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Une erreur est survenue';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters pour accéder facilement aux contrôles dans le template
  get userName() { return this.clientForm.get('userName'); }
  get email() { return this.clientForm.get('email'); }
  get password() { return this.clientForm.get('password'); }
  get phone() { return this.clientForm.get('phone'); }
}
```

### 5. **Template Client Form** - Mise à jour HTML

**Fichier** : `src/app/admin/client-form/client-form.component.html`

```html
<div class="client-form-container">
  <div class="card">
    <div class="card-header">
      <h2>{{ isEditing ? 'Modifier un Client' : 'Créer un Client' }}</h2>
    </div>
    <div class="card-body">
      
      <!-- Messages d'erreur et succès -->
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
      
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
        
        <!-- Username avec validation en temps réel -->
        <div class="form-group">
          <label for="userName">Username *</label>
          <input 
            type="text" 
            id="userName" 
            class="form-control" 
            formControlName="userName"
            [ngClass]="{'is-invalid': userName?.invalid && userName?.touched || !usernameValidation.isValid}"
            placeholder="Ex: jean-marc">
          
          <!-- Validation Angular -->
          <div *ngIf="userName?.invalid && userName?.touched" class="invalid-feedback">
            <small *ngIf="userName?.errors?.['required']">Le username est requis</small>
            <small *ngIf="userName?.errors?.['minlength']">Minimum 3 caractères</small>
            <small *ngIf="userName?.errors?.['maxlength']">Maximum 30 caractères</small>
          </div>
          
          <!-- Validation personnalisée -->
          <div *ngIf="userName?.value && !usernameValidation.isValid" class="invalid-feedback">
            <small>{{ usernameValidation.message }}</small>
          </div>
          
          <div *ngIf="userName?.value && usernameValidation.isValid" class="valid-feedback">
            <small>{{ usernameValidation.message }}</small>
          </div>
        </div>

        <!-- Email avec validation en temps réel -->
        <div class="form-group">
          <label for="email">Email *</label>
          <input 
            type="email" 
            id="email" 
            class="form-control" 
            formControlName="email"
            [ngClass]="{'is-invalid': email?.invalid && email?.touched || !emailValidation.isValid}"
            placeholder="client@example.com">
          
          <div *ngIf="email?.invalid && email?.touched" class="invalid-feedback">
            <small *ngIf="email?.errors?.['required']">L'email est requis</small>
            <small *ngIf="email?.errors?.['email']">Format email invalide</small>
          </div>
          
          <div *ngIf="email?.value && !emailValidation.isValid" class="invalid-feedback">
            <small>{{ emailValidation.message }}</small>
          </div>
          
          <div *ngIf="email?.value && emailValidation.isValid" class="valid-feedback">
            <small>{{ emailValidation.message }}</small>
          </div>
        </div>

        <!-- Mot de passe avec validation en temps réel -->
        <div class="form-group">
          <label for="password">Mot de passe *</label>
          <input 
            type="password" 
            id="password" 
            class="form-control" 
            formControlName="password"
            [ngClass]="{'is-invalid': password?.invalid && password?.touched || !passwordValidation.isValid}"
            placeholder="Minimum 6 caractères, 1 lettre et 1 chiffre">
          
          <div *ngIf="password?.invalid && password?.touched" class="invalid-feedback">
            <small *ngIf="password?.errors?.['required']">Le mot de passe est requis</small>
            <small *ngIf="password?.errors?.['minlength']">Minimum 6 caractères</small>
          </div>
          
          <div *ngIf="password?.value && !passwordValidation.isValid" class="invalid-feedback">
            <small>{{ passwordValidation.message }}</small>
          </div>
          
          <div *ngIf="password?.value && passwordValidation.isValid" class="valid-feedback">
            <small>{{ passwordValidation.message }}</small>
          </div>
        </div>

        <!-- Téléphone avec validation en temps réel -->
        <div class="form-group">
          <label for="phone">Téléphone *</label>
          <input 
            type="tel" 
            id="phone" 
            class="form-control" 
            formControlName="phone"
            [ngClass]="{'is-invalid': phone?.invalid && phone?.touched || !phoneValidation.isValid}"
            placeholder="8 chiffres commençant par 2-9">
          
          <div *ngIf="phone?.invalid && phone?.touched" class="invalid-feedback">
            <small *ngIf="phone?.errors?.['required']">Le téléphone est requis</small>
            <small *ngIf="phone?.errors?.['min']">Numéro invalide</small>
            <small *ngIf="phone?.errors?.['max']">Numéro invalide</small>
          </div>
          
          <div *ngIf="phone?.value && phone?.value !== 0 && !phoneValidation.isValid" class="invalid-feedback">
            <small>{{ phoneValidation.message }}</small>
          </div>
          
          <div *ngIf="phone?.value && phone?.value !== 0 && phoneValidation.isValid" class="valid-feedback">
            <small>{{ phoneValidation.message }}</small>
          </div>
        </div>

        <!-- Champs optionnels -->
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="age">Âge</label>
              <input type="number" id="age" class="form-control" formControlName="age" min="1" max="120">
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="sexe">Sexe</label>
              <select id="sexe" class="form-control" formControlName="sexe">
                <option value="">Sélectionner...</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="profession">Profession</label>
          <input type="text" id="profession" class="form-control" formControlName="profession">
        </div>

        <div class="form-group">
          <label for="situationFamiliale">Situation Familiale</label>
          <select id="situationFamiliale" class="form-control" formControlName="situationFamiliale">
            <option value="">Sélectionner...</option>
            <option value="Célibataire">Célibataire</option>
            <option value="Marié">Marié</option>
            <option value="Mariée">Mariée</option>
            <option value="Divorcé">Divorcé</option>
            <option value="Divorcée">Divorcée</option>
            <option value="Veuf">Veuf</option>
            <option value="Veuve">Veuve</option>
          </select>
        </div>

        <!-- Informations médicales -->
        <div class="card medical-section">
          <div class="card-header">
            <h5>Informations Médicales</h5>
          </div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="maladieChronique" class="form-check-input" formControlName="maladieChronique">
              <label class="form-check-label" for="maladieChronique">
                Maladie chronique
              </label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="diabetique" class="form-check-input" formControlName="diabetique">
              <label class="form-check-label" for="diabetique">
                Diabétique
              </label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="tension" class="form-check-input" formControlName="tension">
              <label class="form-check-label" for="tension">
                Tension artérielle
              </label>
            </div>
            <div class="form-group">
              <label for="nombreBeneficiaires">Nombre de bénéficiaires</label>
              <input type="number" id="nombreBeneficiaires" class="form-control" formControlName="nombreBeneficiaires" min="1" max="10">
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="router.navigate(['/admin/clients'])">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="loading || clientForm.invalid">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isEditing ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
```

### 6. **Styles CSS** - Amélioration visuelle

**Fichier** : `src/app/admin/client-form/client-form.component.css`

```css
.client-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}

.card-header h2 {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control {
  border-radius: 6px;
  border: 1px solid #ced4da;
  padding: 0.75rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-valid {
  border-color: #28a745;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.valid-feedback {
  color: #28a745;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.medical-section {
  margin-top: 2rem;
  border: 1px solid #e9ecef;
}

.medical-section .card-header {
  background-color: #e3f2fd;
}

.medical-section .card-header h5 {
  margin: 0;
  color: #1976d2;
  font-weight: 500;
}

.form-check {
  margin-bottom: 0.75rem;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-check-label {
  font-weight: 400;
}

.form-actions {
  margin-top: 2rem;
  text-align: right;
}

.form-actions .btn {
  margin-left: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.alert {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

/* Responsive */
@media (max-width: 768px) {
  .client-form-container {
    padding: 10px;
  }
  
  .form-actions {
    text-align: center;
  }
  
  .form-actions .btn {
    display: block;
    width: 100%;
    margin: 0.5rem 0;
  }
}
```

## 🔄 Intégration dans le Module

**Fichier** : `src/app/admin/admin.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientFormComponent } from './client-form/client-form.component';
import { ClientService } from '../shared/services/client.service';
import { ValidationService } from '../shared/services/validation.service';

@NgModule({
  declarations: [
    ClientFormComponent,
    // ... autres composants
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // ... autres imports
  ],
  providers: [
    ClientService,
    ValidationService,
    // ... autres services
  ]
})
export class AdminModule { }
```

## 🎯 Utilisation

1. **Navigation vers le formulaire** :
   ```typescript
   // Dans un autre composant
   this.router.navigate(['/admin/clients/new']);
   ```

2. **Le formulaire affichera** :
   - Validation en temps réel
   - Messages d'erreur clairs
   - Feedback visuel (vert/rouge)
   - Bouton désactivé si formulaire invalide

3. **Exemples de validation** :
   - Username : `jean-marc` ✅ | `jean marc` ❌
   - Mot de passe : `pass123` ✅ | `123` ❌
   - Email : `user@domain.com` ✅ | `user@` ❌
   - Téléphone : `21234567` ✅ | `12345678` ❌

## 📊 Avantages

- ✅ **Validation en temps réel** : Feedback immédiat
- ✅ **Messages clairs** : Guide l'utilisateur
- ✅ **UX améliorée** : Code couleur vert/rouge
- ✅ **Robustesse** : Double validation (côté client + serveur)
- ✅ **Réactivité** : Adapte l'affichage selon les erreurs

Ces changements garantissent une expérience utilisateur optimale avec des validations cohérentes entre le frontend et le backend.
