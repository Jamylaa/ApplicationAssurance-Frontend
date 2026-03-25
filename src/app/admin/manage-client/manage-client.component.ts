import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Client, ClientDTO } from '../../shared/models/client.model';
import { ValidationService } from '../../shared/services/validation.service';
import { ClientService, ValidationResult } from '../../shared/services/client.service';
import { UserValidator } from '../../shared/validators/user-validator';

@Component({
  selector: 'app-manage-client',
  templateUrl: './manage-client.component.html',
  styleUrls: ['./manage-client.component.css']
})
export class ManageClientComponent implements OnInit, OnDestroy {
  clientForm: FormGroup;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchText = '';
  selectedClientId: string | null = null;
  pendingEditId: string | null = null;
  successMsg = '';
  errorMsg = '';
  showForm = false;
  loading = false;

  usernameValidation: ValidationResult = { isValid: true, message: '' };
  passwordValidation: ValidationResult = { isValid: true, message: '' };
  emailValidation: ValidationResult = { isValid: true, message: '' };
  phoneValidation: ValidationResult = { isValid: true, message: '' };

  private destroy$ = new Subject<void>();

  breadcrumbItems = [{ label: 'Clients', link: '/admin/clients' }];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.clientForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), UserValidator.usernameFormat()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6), UserValidator.passwordStrength()]],
      phone: ['', [Validators.required, UserValidator.tunisianPhone()]],
      role: ['CLIENT'],
      age: [25, Validators.required],
      sexe: ['M', Validators.required],
      profession: ['', Validators.required],
      situationFamiliale: ['CELIBATAIRE'],
      maladieChronique: [false],
      diabetique: [false],
      tension: [false],
      nombreBeneficiaires: [0],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.setupRealTimeValidation();

    this.route.queryParamMap.subscribe((params) => {
      const editId = params.get('editId');
      if (editId) {
        this.pendingEditId = editId;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (res) => {
        this.clients = res;
        this.filteredClients = res;

        if (this.pendingEditId) {
          const client = this.clients.find((c) => c.idUser === this.pendingEditId);
          if (client) {
            this.updateClient(client);
            this.showForm = true;
          }
          this.pendingEditId = null;
          this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Erreur chargement clients';
      }
    });
  }

  filterClients(): void {
    const search = this.searchText.toLowerCase();
    this.filteredClients = this.clients.filter((client) =>
      client.userName?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.profession?.toLowerCase().includes(search)
    );
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.filterClients();
  }

  updateClient(client: Client): void {
    this.selectedClientId = client.idUser!;

    const passwordControl = this.clientForm.get('password');
    passwordControl?.setValidators([Validators.minLength(6), UserValidator.passwordStrength()]);
    passwordControl?.updateValueAndValidity();

    this.clientForm.patchValue({
      userName: client.userName,
      email: client.email,
      phone: client.phone,
      age: client.age,
      sexe: client.sexe,
      profession: client.profession,
      situationFamiliale: client.situationFamiliale,
      maladieChronique: client.maladieChronique,
      diabetique: client.diabetique,
      tension: client.tension,
      nombreBeneficiaires: client.nombreBeneficiaires,
      role: client.role || 'CLIENT'
    });
  }

  onSubmit(): void {
    if (!this.clientForm.valid) {
      this.errorMsg = 'Veuillez remplir correctement tous les champs obligatoires.';
      this.clientForm.markAllAsTouched();
      return;
    }

    if (!this.usernameValidation.isValid || !this.emailValidation.isValid || !this.phoneValidation.isValid) {
      this.errorMsg = 'Veuillez corriger les erreurs de validation avant de soumettre.';
      return;
    }

    if (!this.selectedClientId && !this.passwordValidation.isValid) {
      this.errorMsg = 'Veuillez corriger le mot de passe avant de soumettre.';
      return;
    }

    const userName = String(this.clientForm.value.userName ?? '').trim();
    const email = String(this.clientForm.value.email ?? '').trim().toLowerCase();

    if (this.isUserNameTaken(userName)) {
      this.clientForm.get('userName')?.setErrors({ userNameTaken: true });
      this.errorMsg = "Ce nom d'utilisateur existe deja.";
      return;
    }

    if (this.isEmailTaken(email)) {
      this.clientForm.get('email')?.setErrors({ emailTaken: true });
      this.errorMsg = 'Cet email est deja utilise.';
      return;
    }

    const payload: ClientDTO = { ...this.clientForm.value };
    if (!payload.password) {
      delete payload.password;
    }

    payload.userName = userName;
    payload.email = email;
    payload.phone = Number(payload.phone);

    this.loading = true;

    const request$ = this.selectedClientId
      ? this.clientService.updateClient(this.selectedClientId, payload)
      : this.clientService.createClient(payload);

    request$.subscribe({
      next: () => {
        this.successMsg = this.selectedClientId ? 'Client modifie avec succes' : 'Client cree avec succes';
        this.errorMsg = '';
        this.selectedClientId = null;
        this.showForm = false;
        this.resetForm();
        this.loadClients();
      },
      error: (err: any) => {
        console.error(err);
        this.errorMsg = err?.message || 'Erreur operation client';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  deleteClient(id: string): void {
    if (!confirm('Voulez-vous supprimer ce client ?')) return;

    this.clientService.deleteClient(id).subscribe({
      next: () => {
        this.successMsg = 'Client supprime';
        this.errorMsg = '';
        this.clients = this.clients.filter((c) => c.idUser !== id);
        this.filteredClients = this.filteredClients.filter((c) => c.idUser !== id);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.errorMsg = 'Erreur suppression';
      }
    });
  }

  resetForm(): void {
    const passwordControl = this.clientForm.get('password');
    passwordControl?.setValidators([Validators.required, Validators.minLength(6), UserValidator.passwordStrength()]);
    passwordControl?.updateValueAndValidity();

    this.clientForm.reset({
      userName: '',
      email: '',
      password: '',
      phone: '',
      role: 'CLIENT',
      age: 25,
      sexe: 'M',
      profession: '',
      situationFamiliale: 'CELIBATAIRE',
      maladieChronique: false,
      diabetique: false,
      tension: false,
      nombreBeneficiaires: 0,
      actif: true
    });

    this.usernameValidation = { isValid: true, message: '' };
    this.passwordValidation = { isValid: true, message: '' };
    this.emailValidation = { isValid: true, message: '' };
    this.phoneValidation = { isValid: true, message: '' };
  }

  private isUserNameTaken(userName: string): boolean {
    return this.clients.some(
      (c) => c.idUser !== this.selectedClientId && String(c.userName ?? '').trim().toLowerCase() === userName.toLowerCase()
    );
  }

  private isEmailTaken(email: string): boolean {
    return this.clients.some(
      (c) => c.idUser !== this.selectedClientId && String(c.email ?? '').trim().toLowerCase() === email
    );
  }

  private setupRealTimeValidation(): void {
    this.clientForm
      .get('userName')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (!value) {
          this.usernameValidation = { isValid: false, message: 'Le username ne peut pas etre vide' };
          return;
        }

        this.validationService
          .validateUsername(value)
          .pipe(takeUntil(this.destroy$))
          .subscribe((result) => (this.usernameValidation = result));
      });

    this.clientForm
      .get('password')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (!value && this.selectedClientId) {
          this.passwordValidation = { isValid: true, message: '' };
          return;
        }

        this.validationService
          .validatePassword(value)
          .pipe(takeUntil(this.destroy$))
          .subscribe((result) => (this.passwordValidation = result));
      });

    this.clientForm
      .get('email')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.emailValidation = this.validationService.validateEmail(value);
      });

    this.clientForm
      .get('phone')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.phoneValidation = this.validationService.validatePhone(value);
      });
  }
}
