import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs/operators';
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

  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

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
      password: ['', [Validators.required, Validators.minLength(6), UserValidator.passwordStrength()]],
      phone: ['', [Validators.required, UserValidator.tunisianPhone()]],
      age: [25, [Validators.required, Validators.min(0)]],
      sexe: ['M', Validators.required],
      profession: ['', Validators.required],
      situationFamiliale: ['CELIBATAIRE', Validators.required],
      maladieChronique: [false],
      diabetique: [false],
      tension: [false],
      nombreBeneficiaires: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const editId = params.get('editId');
      if (editId) {
        this.pendingEditId = editId;
      }
    });

    this.setupSearch();
    this.setupRealTimeValidation();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (res) => this.applyClientList(res, true),
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Erreur chargement clients';
      }
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.search$.next(this.searchText);
  }

  updateClient(client: Client): void {
    this.selectedClientId = client.idUser ?? null;
    this.showForm = true;
    this.successMsg = '';
    this.errorMsg = '';

    const passwordControl = this.clientForm.get('password');
    passwordControl?.setValidators([Validators.minLength(6), UserValidator.passwordStrength()]);
    passwordControl?.setValue('');
    passwordControl?.updateValueAndValidity();

    this.passwordValidation = { isValid: true, message: '' };

    this.clientForm.patchValue({
      userName: client.userName,
      email: client.email,
      phone: client.phone,
      age: client.age,
      sexe: client.sexe || 'M',
      profession: client.profession,
      situationFamiliale: client.situationFamiliale || 'CELIBATAIRE',
      maladieChronique: client.maladieChronique,
      diabetique: client.diabetique,
      tension: client.tension,
      nombreBeneficiaires: client.nombreBeneficiaires ?? 1
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

    const rawValue = this.clientForm.getRawValue();
    const password = String(rawValue.password ?? '').trim();
    const payload: ClientDTO = {
      userName,
      email,
      phone: Number(rawValue.phone),
      age: Number(rawValue.age),
      sexe: String(rawValue.sexe ?? 'M'),
      profession: String(rawValue.profession ?? '').trim(),
      situationFamiliale: String(rawValue.situationFamiliale ?? '').trim(),
      maladieChronique: Boolean(rawValue.maladieChronique),
      diabetique: Boolean(rawValue.diabetique),
      tension: Boolean(rawValue.tension),
      nombreBeneficiaires: Number(rawValue.nombreBeneficiaires)
    };

    if (password) {
      payload.password = password;
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const request$ = this.selectedClientId
      ? this.clientService.updateClient(this.selectedClientId, payload)
      : this.clientService.createClient(payload);

    request$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.successMsg = this.selectedClientId ? 'Client modifie avec succes' : 'Client cree avec succes';
          this.selectedClientId = null;
          this.showForm = false;
          this.resetForm();
          this.refreshClients();
        },
        error: (err: any) => {
          console.error(err);
          this.errorMsg = err?.message || 'Erreur operation client';
        }
      });
  }

  deleteClient(id: string): void {
    if (!confirm('Voulez-vous supprimer ce client ?')) return;

    this.clientService.deleteClient(id).subscribe({
      next: () => {
        this.successMsg = 'Client supprime';
        this.errorMsg = '';
        this.refreshClients();
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.errorMsg = 'Erreur suppression';
      }
    });
  }

  resetForm(): void {
    this.selectedClientId = null;

    const passwordControl = this.clientForm.get('password');
    passwordControl?.setValidators([Validators.required, Validators.minLength(6), UserValidator.passwordStrength()]);
    passwordControl?.updateValueAndValidity();

    this.clientForm.reset({
      userName: '',
      email: '',
      password: '',
      phone: '',
      age: 25,
      sexe: 'M',
      profession: '',
      situationFamiliale: 'CELIBATAIRE',
      maladieChronique: false,
      diabetique: false,
      tension: false,
      nombreBeneficiaires: 1
    });

    this.usernameValidation = { isValid: true, message: '' };
    this.passwordValidation = { isValid: true, message: '' };
    this.emailValidation = { isValid: true, message: '' };
    this.phoneValidation = { isValid: true, message: '' };
  }

  private refreshClients(): void {
    const query = this.searchText.trim();
    const request$ = query ? this.clientService.searchClients(query) : this.clientService.getAllClients();

    request$.subscribe({
      next: (res) => this.applyClientList(res),
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Erreur chargement clients';
      }
    });
  }

  private applyClientList(clients: Client[], allowPendingEdit = false): void {
    this.clients = clients;
    this.filteredClients = clients;

    if (!allowPendingEdit || !this.pendingEditId) {
      return;
    }

    const client = this.clients.find((item) => item.idUser === this.pendingEditId);
    if (client) {
      this.updateClient(client);
    }

    this.pendingEditId = null;
    this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
  }

  private isUserNameTaken(userName: string): boolean {
    return this.clients.some(
      (client) => client.idUser !== this.selectedClientId && String(client.userName ?? '').trim().toLowerCase() === userName.toLowerCase()
    );
  }

  private isEmailTaken(email: string): boolean {
    return this.clients.some(
      (client) => client.idUser !== this.selectedClientId && String(client.email ?? '').trim().toLowerCase() === email
    );
  }

  private setupSearch(): void {
    this.search$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmedQuery = query.trim();
          return trimmedQuery ? this.clientService.searchClients(trimmedQuery) : this.clientService.getAllClients();
        })
      )
      .subscribe({
        next: (clients) => this.applyClientList(clients),
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Erreur lors de la recherche';
        }
      });
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
        this.validationService
          .validateEmail(value)
          .pipe(takeUntil(this.destroy$))
          .subscribe((result) => (this.emailValidation = result));
      });

    this.clientForm
      .get('phone')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.phoneValidation = this.validationService.validatePhone(value);
      });
  }
}
