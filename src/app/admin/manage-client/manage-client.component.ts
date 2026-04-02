import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { ConfirmationService, MessageService } from 'primeng/api';
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
  loading = false;
  listLoading = false;
  showForm = false;
  selectedClientId: string | null = null;

  usernameValidation: ValidationResult = { isValid: true, message: '' };
  passwordValidation: ValidationResult = { isValid: true, message: '' };
  emailValidation: ValidationResult = { isValid: true, message: '' };
  phoneValidation: ValidationResult = { isValid: true, message: '' };

  private initialEditValues: { userName: string; email: string } | null = null;
  private readonly destroy$ = new Subject<void>();

  breadcrumbItems = [{ label: 'Clients', link: '/admin/clients' }];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.clientForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), UserValidator.usernameFormat()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), UserValidator.passwordStrength()]],
      phone: ['', [Validators.required, UserValidator.tunisianPhone()]],
      age: [25, [Validators.required, Validators.min(0), Validators.max(150)]],
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
    this.setupRealTimeValidation();
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClients(): void {
    this.listLoading = true;
    this.clientService.getAllClients().subscribe({
      next: (res) => {
        this.clients = res;
        this.listLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les clients' });
        this.listLoading = false;
      }
    });
  }

  updateClient(client: Client): void {
    this.selectedClientId = client.idUser ?? null;
    this.initialEditValues = {
      userName: String(client.userName ?? '').trim(),
      email: String(client.email ?? '').trim().toLowerCase()
    };
    this.showForm = true;

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
      this.clientForm.markAllAsTouched();
      return;
    }

    if (!this.usernameValidation.isValid || !this.emailValidation.isValid || !this.phoneValidation.isValid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez corriger les erreurs de validation' });
      return;
    }

    if (!this.selectedClientId && !this.passwordValidation.isValid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Le mot de passe n\'est pas valide' });
      return;
    }

    const userName = String(this.clientForm.value.userName ?? '').trim();
    const email = String(this.clientForm.value.email ?? '').trim().toLowerCase();

    if (this.isUserNameTaken(userName)) {
      this.clientForm.get('userName')?.setErrors({ userNameTaken: true });
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Ce nom d\'utilisateur est déjà pris' });
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
    const request$ = this.selectedClientId
      ? this.clientService.updateClient(this.selectedClientId, payload)
      : this.clientService.createClient(payload);

    request$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Succès', 
            detail: this.selectedClientId ? 'Client modifié' : 'Client créé' 
          });
          this.showForm = false;
          this.resetForm();
          this.loadClients();
        },
        error: (err: any) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue' });
        }
      });
  }

  deleteClient(id: string): void {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer ce client ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Client supprimé' });
            this.loadClients();
          },
          error: (err) => {
            console.error('Erreur suppression:', err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression échouée' });
          }
        });
      }
    });
  }

  resetForm(): void {
    this.selectedClientId = null;
    this.initialEditValues = null;

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

  private isUserNameTaken(userName: string): boolean {
    return this.clients.some(
      (client) => client.idUser !== this.selectedClientId && String(client.userName ?? '').trim().toLowerCase() === userName.toLowerCase()
    );
  }


  private setupRealTimeValidation(): void {
    this.clientForm
      .get('userName')
      ?.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        const normalizedValue = String(value ?? '').trim();

        if (!normalizedValue) {
          this.usernameValidation = { isValid: false, message: 'Le username ne peut pas etre vide' };
          return;
        }

        if (this.selectedClientId && normalizedValue === this.initialEditValues?.userName) {
          this.usernameValidation = { isValid: true, message: 'Username inchange' };
          return;
        }

        this.validationService
          .validateUsername(normalizedValue)
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
        const normalizedValue = String(value ?? '').trim().toLowerCase();

        if (this.selectedClientId && normalizedValue === this.initialEditValues?.email) {
          this.emailValidation = { isValid: true, message: 'Email inchange' };
          return;
        }
        this.validationService
          .validateEmail(normalizedValue)
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
