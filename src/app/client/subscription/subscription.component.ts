import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, catchError, finalize, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Client } from '../../shared/models/client.model';
import { Produit } from '../../shared/models/produit.model';
import { Pack } from '../../shared/models/pack.model';
import { Subscription } from '../../shared/models/subscription.model';
import { ClientService } from '../../shared/services/client.service';
import { ProduitService } from '../../shared/services/produit.service';
import {
  CreateSubscriptionRequest,
  SubscriptionService
} from '../../shared/services/subscription.service';

interface StatusOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  readonly statusOptions: StatusOption[] = [
    { label: 'Tous les statuts', value: 'TOUS' },
    { label: 'En attente', value: 'EN_ATTENTE' },
    { label: 'En cours', value: 'EN_COURS' },
    { label: 'Termine', value: 'TERMINE' },
    { label: 'Annule', value: 'ANNULE' }
  ];

  souscriptionForm: FormGroup;
  clients: Client[] = [];
  produits: Produit[] = [];
  packs: Pack[] = [];
  contrats: Subscription[] = [];
  filteredContrats: Subscription[] = [];

  selectedClient: Client | null = null;
  selectedProduit: Produit | null = null;
  selectedPack: Pack | null = null;
  selectedContract: Subscription | null = null;

  searchTerm = '';
  statusFilter = 'TOUS';
  renewalDuration = 12;

  referencesLoading = true;
  contractsLoading = true;
  detailsLoading = false;
  submitLoading = false;
  actionLoading = false;
  actionTargetId = '';
  formSubmitted = false;

  successMessage = '';
  errorMessage = '';

  private currentClientId = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly subscriptionService: SubscriptionService,
    private readonly clientService: ClientService,
    private readonly produitService: ProduitService,
    private readonly authService: AuthService
  ) {
    this.souscriptionForm = this.fb.group({
      clientId: ['', Validators.required],
      packId: [''],
      produitId: ['', Validators.required],
      dateDebut: [this.toDateInputValue(new Date()), Validators.required],
      dureeMois: [12, [Validators.required, Validators.min(1)]],
      primePersonnalisee: [0, [Validators.min(0)]],
      optionsSupplementaires: ['']
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadContracts();
  }

  get totalContracts(): number {
    return this.contrats.length;
  }

  get pendingContracts(): number {
    return this.contrats.filter((contract) => this.getStatusKey(contract.statut) === 'EN_ATTENTE').length;
  }

  get activeContracts(): number {
    return this.contrats.filter((contract) => this.getStatusKey(contract.statut) === 'EN_COURS').length;
  }

  get cancelledContracts(): number {
    return this.contrats.filter((contract) => this.getStatusKey(contract.statut) === 'ANNULE').length;
  }

  loadReferenceData(): void {
    this.referencesLoading = true;

    forkJoin({
      clients: this.clientService.getAllClients().pipe(
        catchError((error) => {
          this.setError(this.extractErrorMessage(error, 'Impossible de charger la liste des clients.'));
          return of([] as Client[]);
        })
      ),
      produits: this.produitService.getAllProduits().pipe(
        catchError((error) => {
          this.setError(this.extractErrorMessage(error, 'Impossible de charger la liste des produits.'));
          return of([] as Produit[]);
        })
      ),
      packs: this.produitService.getAllPacks().pipe(
        catchError((error) => {
          this.setError(this.extractErrorMessage(error, 'Impossible de charger la liste des packs.'));
          return of([] as Pack[]);
        })
      )
    })
      .pipe(finalize(() => (this.referencesLoading = false)))
      .subscribe(({ clients, produits, packs }) => {
        this.clients = [...clients].sort((left, right) =>
          this.getClientLabel(left).localeCompare(this.getClientLabel(right))
        );
        this.produits = produits.filter((produit) => produit.actif);
        this.packs = packs.filter((pack) => pack.actif);

        this.prefillCurrentClient();
        this.onClientChange();
        this.onPackChange();
        this.onProduitChange();
      });
  }

  loadContracts(selectedContractId?: string): void {
    this.contractsLoading = true;

    this.subscriptionService
      .getAllSubscriptions()
      .pipe(finalize(() => (this.contractsLoading = false)))
      .subscribe({
        next: (contracts) => {
          this.contrats = this.sortContracts(contracts ?? []);
          this.applyFilters();

          const targetId = selectedContractId || this.selectedContract?.idContrat || '';
          if (targetId) {
            this.selectedContract = this.contrats.find((contract) => contract.idContrat === targetId) ?? null;
          } else if (!this.selectedContract && this.filteredContrats.length > 0) {
            this.selectedContract = this.filteredContrats[0];
          }

          if (this.selectedContract) {
            this.renewalDuration = Math.max(1, Number(this.selectedContract.dureeMois ?? 12));
          }
        },
        error: (error) => {
          this.contrats = [];
          this.filteredContrats = [];
          this.selectedContract = null;
          this.setError(this.extractErrorMessage(error, 'Impossible de charger les contrats.'));
        }
      });
  }

  onClientChange(): void {
    const clientId = String(this.souscriptionForm.get('clientId')?.value ?? '').trim();
    this.selectedClient = this.clients.find((client) => client.idUser === clientId) ?? null;
  }
  
  onPackChange(): void {
    const packId = String(this.souscriptionForm.get('packId')?.value ?? '').trim();
    this.selectedPack = this.packs.find((pack) => pack.idPack === packId) ?? null;
    
    if (this.selectedPack && this.selectedPack.produitsIds && this.selectedPack.produitsIds.length > 0) {
      // Optionnel : Autofill du premier produit du pack s'il y en a un
      const firstProduitId = this.selectedPack.produitsIds[0];
      this.souscriptionForm.get('produitId')?.setValue(firstProduitId);
      this.onProduitChange();
    }
  }

  onProduitChange(): void {
    const produitId = String(this.souscriptionForm.get('produitId')?.value ?? '').trim();
    this.selectedProduit = this.produits.find((produit) => produit.idProduit === produitId) ?? null;

    if (!this.selectedProduit) {
      return;
    }

    const primeControl = this.souscriptionForm.get('primePersonnalisee');
    const currentPrime = Number(primeControl?.value ?? 0);

    if (!currentPrime && this.selectedProduit.prixBase >= 0) {
      primeControl?.setValue(this.selectedProduit.prixBase);
    }
  }

  submitSubscription(): void {
    this.formSubmitted = true;
    this.clearMessages();

    if (this.souscriptionForm.invalid) {
      this.souscriptionForm.markAllAsTouched();
      this.setError('Veuillez corriger les champs obligatoires avant de continuer.');
      return;
    }

    const rawValue = this.souscriptionForm.getRawValue();
    const payload: CreateSubscriptionRequest = {
      clientId: String(rawValue.clientId ?? '').trim(),
      produitId: String(rawValue.produitId ?? '').trim(),
      packId: String(rawValue.packId ?? '').trim() || undefined,
      dateDebut: String(rawValue.dateDebut ?? '').trim(),
      dureeMois: Number(rawValue.dureeMois ?? 0),
      primePersonnalisee: Number(rawValue.primePersonnalisee ?? 0),
      optionsSupplementaires: this.normalizeOptionalText(rawValue.optionsSupplementaires)
    };

    this.submitLoading = true;

    this.subscriptionService
      .createSubscription(payload)
      .pipe(finalize(() => (this.submitLoading = false)))
      .subscribe({
        next: (contract) => {
          this.setSuccess('La souscription a ete creee avec succes.');
          this.resetForm();
          this.loadContracts(contract?.idContrat);
        },
        error: (error) => {
          this.setError(this.extractErrorMessage(error, 'La creation du contrat a echoue.'));
        }
      });
  }

  selectContract(contract: Subscription): void {
    this.selectedContract = contract;
    this.renewalDuration = Math.max(1, Number(contract.dureeMois ?? 12));

    if (!contract.idContrat) {
      return;
    }

    this.detailsLoading = true;

    this.subscriptionService
      .getSubscriptionById(contract.idContrat)
      .pipe(finalize(() => (this.detailsLoading = false)))
      .subscribe({
        next: (details) => {
          this.selectedContract = details;
          this.renewalDuration = Math.max(1, Number(details.dureeMois ?? 12));
        },
        error: () => {
          this.selectedContract = contract;
        }
      });
  }

  renewSelectedContract(): void {
    if (!this.selectedContract?.idContrat) {
      this.setError('Selectionnez un contrat avant de lancer un renouvellement.');
      return;
    }

    if (!Number.isFinite(this.renewalDuration) || this.renewalDuration < 1) {
      this.setError('La duree de renouvellement doit etre superieure ou egale a 1 mois.');
      return;
    }

    this.runContractAction(this.selectedContract.idContrat, () =>
      this.subscriptionService.renewSubscription(this.selectedContract!.idContrat!, this.renewalDuration),
      'Le contrat a ete renouvele avec succes.'
    );
  }

  terminateSelectedContract(): void {
    if (!this.selectedContract?.idContrat) {
      this.setError('Selectionnez un contrat avant de lancer une resiliation.');
      return;
    }

    if (!window.confirm('Confirmer la resiliation de ce contrat ?')) {
      return;
    }

    this.runContractAction(
      this.selectedContract.idContrat,
      () => this.subscriptionService.terminateSubscription(this.selectedContract!.idContrat!),
      'Le contrat a ete resilie avec succes.'
    );
  }

  refreshContracts(): void {
    this.loadContracts(this.selectedContract?.idContrat);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'TOUS';
    this.applyFilters();
  }

  applyFilters(): void {
    const normalizedSearch = this.normalizeSearchValue(this.searchTerm);

    this.filteredContrats = this.sortContracts(
      this.contrats.filter((contract) => {
        const matchesStatus =
          this.statusFilter === 'TOUS' || this.getStatusKey(contract.statut) === this.statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableFields = [
          contract.idContrat,
          this.getContractClientName(contract),
          this.getContractClientEmail(contract),
          this.getContractProductName(contract),
          this.getStatusLabel(contract.statut)
        ];

        return searchableFields.some((value) =>
          this.normalizeSearchValue(value).includes(normalizedSearch)
        );
      })
    );
  }

  isInvalid(controlName: string): boolean {
    const control = this.souscriptionForm.get(controlName);
    return Boolean(control?.invalid && (control.touched || this.formSubmitted));
  }

  trackByContract(_: number, contract: Subscription): string {
    return contract.idContrat ?? `${contract.clientId ?? 'client'}-${contract.produitId ?? 'produit'}`;
  }

  getClientLabel(client: Client | null | undefined): string {
    if (!client) {
      return 'Client inconnu';
    }

    const userName = String(client.userName ?? '').trim();
    const email = String(client.email ?? '').trim();

    return [userName, email].filter(Boolean).join(' - ') || email || userName || 'Client inconnu';
  }

  getContractClientName(contract: Subscription | null | undefined): string {
    const client = contract?.client as Record<string, unknown> | undefined;
    const firstName = String(client?.['prenom'] ?? '').trim();
    const lastName = String(client?.['nom'] ?? '').trim();
    const userName = String(client?.['userName'] ?? '').trim();

    return [firstName, lastName].filter(Boolean).join(' ') || userName || String(contract?.clientId ?? 'Client inconnu');
  }

  getContractClientEmail(contract: Subscription | null | undefined): string {
    const client = contract?.client as Record<string, unknown> | undefined;
    return String(client?.['email'] ?? '').trim();
  }

  getContractProductName(contract: Subscription | null | undefined): string {
    const produit = contract?.produit as Record<string, unknown> | undefined;
    return String(produit?.['nomProduit'] ?? contract?.produitId ?? 'Produit inconnu').trim();
  }

  getComputedEndDate(contract: Subscription | null | undefined): string {
    if (!contract?.dateDebut) {
      return '';
    }

    if (contract.dateFin) {
      return contract.dateFin;
    }

    const start = new Date(contract.dateDebut);
    if (Number.isNaN(start.getTime())) {
      return '';
    }

    start.setMonth(start.getMonth() + Number(contract.dureeMois ?? 0));
    return start.toISOString();
  }

  getStatusKey(status: string | null | undefined): string {
    const normalized = this.normalizeSearchValue(status).toUpperCase();

    if (normalized.includes('ANNUL')) {
      return 'ANNULE';
    }

    if (normalized.includes('ATTENTE')) {
      return 'EN_ATTENTE';
    }

    if (normalized.includes('COURS')) {
      return 'EN_COURS';
    }

    if (normalized.includes('TERM')) {
      return 'TERMINE';
    }

    return normalized || 'INCONNU';
  }

  getStatusLabel(status: string | null | undefined): string {
    switch (this.getStatusKey(status)) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINE':
        return 'Termine';
      case 'ANNULE':
        return 'Annule';
      default:
        return String(status ?? 'Inconnu');
    }
  }

  getStatusClass(status: string | null | undefined): string {
    switch (this.getStatusKey(status)) {
      case 'EN_COURS':
        return 'status-chip status-chip--active';
      case 'TERMINE':
        return 'status-chip status-chip--closed';
      case 'ANNULE':
        return 'status-chip status-chip--cancelled';
      case 'EN_ATTENTE':
      default:
        return 'status-chip status-chip--pending';
    }
  }

  private prefillCurrentClient(): void {
    const currentUser = this.authService.getUser();
    const userId = String(currentUser?.idUser ?? currentUser?.id ?? '').trim();
    const email = this.normalizeSearchValue(currentUser?.email);

    const matchedClient =
      this.clients.find((client) => client.idUser === userId) ??
      this.clients.find((client) => this.normalizeSearchValue(client.email) === email);

    if (!matchedClient?.idUser) {
      return;
    }

    this.currentClientId = matchedClient.idUser;

    if (!this.souscriptionForm.get('clientId')?.value) {
      this.souscriptionForm.patchValue({ clientId: matchedClient.idUser });
    }
  }

  private runContractAction(
    contractId: string,
    action: () => Observable<Subscription>,
    successMessage: string
  ): void {
    this.clearMessages();
    this.actionLoading = true;
    this.actionTargetId = contractId;

    action()
      .pipe(
        finalize(() => {
          this.actionLoading = false;
          this.actionTargetId = '';
        })
      )
      .subscribe({
        next: () => {
          this.setSuccess(successMessage);
          this.loadContracts(contractId);
          this.subscriptionService.getSubscriptionById(contractId).subscribe({
            next: (details) => {
              this.selectedContract = details;
            },
            error: () => {
              this.selectedContract =
                this.contrats.find((contract) => contract.idContrat === contractId) ?? this.selectedContract;
            }
          });
        },
        error: (error) => {
          this.setError(this.extractErrorMessage(error, 'L operation demandee a echoue.'));
        }
      });
  }

  private resetForm(): void {
    this.formSubmitted = false;
    this.selectedProduit = null;
    this.souscriptionForm.reset({
      clientId: this.currentClientId,
      packId: '',
      produitId: '',
      dateDebut: this.toDateInputValue(new Date()),
      dureeMois: 12,
      primePersonnalisee: 0,
      optionsSupplementaires: ''
    });
    this.onClientChange();
  }

  private sortContracts(contracts: Subscription[]): Subscription[] {
    return [...contracts].sort((left, right) => {
      const leftTime = new Date(left.dateDebut ?? 0).getTime();
      const rightTime = new Date(right.dateDebut ?? 0).getTime();
      return rightTime - leftTime;
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
      const errorObject = error as {
        message?: string;
        error?: { message?: string } | string;
      };

      if (typeof errorObject.error === 'string' && errorObject.error.trim()) {
        return errorObject.error.trim();
      }

      if (
        errorObject.error &&
        typeof errorObject.error === 'object' &&
        typeof errorObject.error.message === 'string' &&
        errorObject.error.message.trim()
      ) {
        return errorObject.error.message.trim();
      }

      if (typeof errorObject.message === 'string' && errorObject.message.trim()) {
        return errorObject.message.trim();
      }
    }

    return fallback;
  }

  private normalizeSearchValue(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value ?? '').trim();
    return normalized ? normalized : undefined;
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
