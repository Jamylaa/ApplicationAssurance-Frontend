import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Subscription, ClientDetails, ProduitDetails } from '../../shared/models/subscription.model';
import { CreateSubscriptionRequest, SubscriptionService } from '../../shared/services/subscription.service';
import { ProduitService } from '../../shared/services/produit.service';
import { ClientService } from '../../shared/services/client.service';
import { Pack } from '../../shared/models/pack.model';
import { PackService } from '../../shared/services/pack.service';
import { Client } from '../../shared/models/client.model';

@Component({
  selector: 'app-manage-subscription',
  templateUrl: './manage-subscription.component.html',
  styleUrls: ['./manage-subscription.component.css']
})
export class ManageSubscriptionComponent implements OnInit {
  subscriptions: Subscription[] = [];
  isLoading = true;
  selectedPackId: string | null = null;
  showForm = false;
  isEditing = false;
  currentEditId: string | null = null;

  // PrimeNG Steps
  activeStepIndex: number = 0;
  stepItems: MenuItem[] = [
    { label: 'Client' },
    { label: 'Produit' },
    { label: 'Pack' },
    { label: 'Contrat' }
  ];

  produitTypes = [
    { label: 'Santé', value: 'SANTE' },
    { label: 'Auto', value: 'AUTO' },
    { label: 'Habitation', value: 'HABITATION' },
    { label: 'Vie', value: 'VIE' }
  ];

  souscriptionForm: FormGroup;
  products: ProduitDetails[] = [];
  packs: Pack[] = [];
  clients: Client[] = [];

  constructor(
    private subscriptionService: SubscriptionService,
    private produitService: ProduitService,
    private clientService: ClientService,
    private packService: PackService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.souscriptionForm = this.fb.group({
      client: this.fb.group({
        idUser: [''], // Hidden field for unique identification
        nom: ['', [Validators.required]],
        prenom: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^\d{8,}$/)]],
        adresse: ['', [Validators.required]],
        codePostal: ['', [Validators.required]],
        ville: ['', [Validators.required]],
        pays: ['Tunisie', [Validators.required]],
        dateNaissance: ['', [Validators.required]],
        numeroCIN: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        numeroPermis: ['']
      }),
      produit: this.fb.group({
        idProduit: ['', [Validators.required]],
        type: ['', [Validators.required]],
        primePersonnalisee: [0, [Validators.required, Validators.min(0)]],
        optionsSupplementaires: ['']
      }),
      contrat: this.fb.group({
        dateDebut: ['', [Validators.required]],
        dureeMois: [12, [Validators.required, Validators.min(1)]],
        primePersonnalisee: [0, [Validators.required, Validators.min(0)]],
        optionsSupplementaires: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadProducts();
    this.loadPacks();
    this.loadClients();
  }

  loadSubscriptions(): void {
    this.isLoading = true;
    this.subscriptionService.getAllSubscriptions().subscribe({
      next: (res) => {
        this.subscriptions = res;
        this.enrichSubscriptions();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les souscriptions' });
        this.isLoading = false;
      }
    });
  }

  loadProducts(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => {
        this.products = (res as ProduitDetails[]).map((product) => ({
          ...product,
          type: product.type ?? 'SANTE'
        }));
        this.enrichSubscriptions();
      },
      error: (err) => console.error('Erreur chargement produits', err)
    });
  }

  loadPacks(): void {
    this.packService.getAllPacks().subscribe({
      next: (res) => this.packs = res.filter((pack) => pack.actif),
      error: (err) => console.error('Erreur chargement packs', err)
    });
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (res) => {
        this.clients = res as any;
        this.enrichSubscriptions();
      },
      error: (err) => console.error('Erreur chargement clients', err)
    });
  }

  onClientSelect(event: any): void {
    const client = event.value;
    if (!client) return;

    this.souscriptionForm.patchValue({
      client: {
        idUser: client.idUser,
        nom: client.userName,
        prenom: '',
        email: client.email,
        telephone: client.phone?.toString() || '',
        numeroCIN: '', 
        pays: 'Tunisie'
      }
    });
    this.messageService.add({ severity: 'info', summary: 'Client sélectionné', detail: `Informations de ${client.userName} chargées.` });
  }

  enrichSubscriptions(): void {
    if (!this.subscriptions.length) return;

    this.subscriptions.forEach((sub) => {
      // Enrich with Client details
      if (sub.clientId && this.clients.length) {
        const fullClient = this.clients.find((c) => c.idUser === sub.clientId);
        if (fullClient) {
          sub.client = {
            nom: fullClient.userName,
            prenom: '',
            email: fullClient.email,
            telephone: fullClient.phone?.toString() || sub.clientPhone?.toString() || '',
            adresse: '', 
            codePostal: '',
            ville: '',
            pays: 'Tunisie',
            dateNaissance: '',
            numeroCIN: '',
            numeroPermis: ''
          };
        }
      }

      // Enrich with Product details
      if (sub.produitId && this.products.length) {
        const fullProduct = this.products.find((p) => p.idProduit === sub.produitId);
        if (fullProduct) {
          sub.produit = fullProduct;
        }
      }
    });
  }

  nextStep(): void {
    if (this.activeStepIndex < 3) {
      this.activeStepIndex++;
    }
  }

  prevStep(): void {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  submitSubscription(): void {
    if (this.souscriptionForm.invalid) {
      this.souscriptionForm.markAllAsTouched();
      this.logInvalidControls();
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez remplir tous les champs requis' });
      return;
    }

    const value = this.souscriptionForm.value;
    const clientId = value.client.idUser;

    if (!clientId) {
      this.messageService.add({ severity: 'error', summary: 'Client requis', detail: 'Veuillez sélectionner un client existant' });
      return;
    }

    if (!value.produit?.idProduit) {
      this.messageService.add({ severity: 'error', summary: 'Produit requis', detail: 'Veuillez sélectionner un produit' });
      return;
    }

    if (this.isEditing && this.currentEditId) {
      // Fetch original subscription to preserve snapshots
      const original = this.subscriptions.find(s => s.idContrat === this.currentEditId);
      if (!original) return;

      const updatedSubscription: Subscription = {
        ...original,
        clientId: clientId,
        produitId: value.produit.idProduit,
        dateDebut: value.contrat.dateDebut,
        dureeMois: value.contrat.dureeMois,
        primePersonnalisee: value.contrat.primePersonnalisee,
        optionsSupplementaires: value.contrat.optionsSupplementaires,
        // Update snapshots for the frontend view
        clientNom: value.client.nom,
        clientEmail: value.client.email,
        clientPhone: value.client.telephone
      };

      this.subscriptionService.updateSubscription(this.currentEditId, updatedSubscription).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Mis à jour', detail: 'Souscription mise à jour avec succès' });
          this.loadSubscriptions();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour' });
        }
      });
    } else {
      const request: CreateSubscriptionRequest = {
        clientId: clientId,
        produitId: value.produit.idProduit,
        dateDebut: value.contrat.dateDebut,
        dureeMois: value.contrat.dureeMois,
        primePersonnalisee: value.contrat.primePersonnalisee,
        optionsSupplementaires: value.contrat.optionsSupplementaires
      };

      this.subscriptionService.createSubscription(request).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Souscription créée avec succès' });
          this.loadSubscriptions();
          this.resetForm();
          this.showForm = false;
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la création' });
        }
      });
    }
  }

  editSubscription(sub: Subscription): void {
    this.isEditing = true;
    this.currentEditId = sub.idContrat || null;
    this.showForm = true;

    // Patch form with existing data
    this.souscriptionForm.patchValue({
      client: {
        idUser: sub.clientId,
        nom: sub.clientNom || '',
        email: sub.clientEmail || '',
        telephone: sub.clientPhone || '',
        adresse: sub.client?.adresse || '',
        ville: sub.client?.ville || '',
        numeroCIN: sub.client?.numeroCIN || '',
        pays: sub.client?.pays || 'Tunisie'
      },
      produit: {
        idProduit: sub.produitId,
        type: sub.produit?.type || '',
        primePersonnalisee: sub.primePersonnalisee,
        optionsSupplementaires: sub.optionsSupplementaires
      },
      contrat: {
        dateDebut: sub.dateDebut ? new Date(sub.dateDebut).toISOString().split('T')[0] : '',
        dureeMois: sub.dureeMois,
        primePersonnalisee: sub.primePersonnalisee,
        optionsSupplementaires: sub.optionsSupplementaires
      }
    });

    this.onTypeChange();
    this.onProductChange();
  }

  deleteSubscription(id: string): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer cette souscription ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.subscriptionService.deleteSubscription(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Souscription supprimée' });
            this.loadSubscriptions();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression' });
          }
        });
      }
    });
  }

  deactivateSubscription(sub: Subscription): void {
    if (!sub.idContrat) return;
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment résilier le contrat #${sub.idContrat.substring(0, 8)} ?`,
      header: 'Résilier Contrat',
      icon: 'pi pi-power-off',
      acceptLabel: 'Résilier',
      rejectLabel: 'Annuler',
      accept: () => {
        this.subscriptionService.terminateSubscription(sub.idContrat!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Résilié', detail: 'Contrat marqué comme résilié' });
            this.loadSubscriptions();
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la résiliation' });
          }
        });
      }
    });
  }

  getProductsByType(): ProduitDetails[] {
    const type = this.souscriptionForm.get('produit.type')?.value;
    return type ? this.products.filter((p) => p.type === type) : this.products;
  }

  onTypeChange(): void {
    this.selectedPackId = null;
    this.souscriptionForm.get('produit.idProduit')?.setValue('');
  }

  onProductChange(): void {
    const selectedProductId = this.souscriptionForm.get('produit.idProduit')?.value;

    if (!selectedProductId) {
      this.selectedPackId = null;
      return;
    }

    const matchingPack = this.getPacksByType().find((pack) => pack.produitsIds.includes(selectedProductId));
    this.selectedPackId = matchingPack?.idPack ?? null;
  }

  getPacksByType(): Pack[] {
    const type = this.souscriptionForm.get('produit.type')?.value;
    const selectedProductId = this.souscriptionForm.get('produit.idProduit')?.value;

    const matchingProducts = this.getProductsByType().map((product) => product.idProduit).filter(Boolean) as string[];
    const targetProductIds = selectedProductId ? [selectedProductId] : matchingProducts;

    if (!type || targetProductIds.length === 0) {
      return [];
    }

    return this.packs.filter((pack) =>
      Array.isArray(pack.produitsIds) && pack.produitsIds.some((id) => targetProductIds.includes(id))
    );
  }

  selectPack(pack: Pack): void {
    this.selectedPackId = pack.idPack ?? null;

    const availableProductIds = this.getProductsByType()
      .map((product) => product.idProduit)
      .filter((id): id is string => Boolean(id));

    const matchingProductId = pack.produitsIds.find((id) => availableProductIds.includes(id));
    const currentProductId = this.souscriptionForm.get('produit.idProduit')?.value;

    if (matchingProductId && currentProductId !== matchingProductId) {
      this.souscriptionForm.get('produit.idProduit')?.setValue(matchingProductId);
    }
  }

  isSelectedPack(pack: Pack): boolean {
    return Boolean(pack.idPack && this.selectedPackId === pack.idPack);
  }

  getSelectedPack(): Pack | null {
    return this.packs.find((pack) => pack.idPack === this.selectedPackId) ?? null;
  }

  getPackProductNames(pack: Pack): string {
    const productNames = this.products
      .filter((product) => Boolean(product.idProduit && pack.produitsIds.includes(product.idProduit)))
      .map((product) => product.nomProduit);

    return productNames.length > 0 ? productNames.join(', ') : 'Aucun produit associe';
  }

  private findExistingClient(clientFormValue: ClientDetails | undefined): Client | null {
    const email = String(clientFormValue?.email ?? '').trim().toLowerCase();
    const phone = String(clientFormValue?.telephone ?? '').trim();

    return (
      this.clients.find((client) => String(client.email ?? '').trim().toLowerCase() === email) ??
      this.clients.find((client) => String(client.phone ?? '').trim() === phone) ??
      null
    );
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentEditId = null;
    this.selectedPackId = null;
    this.souscriptionForm.reset({
      client: {
        idUser: '', nom: '', prenom: '', email: '', telephone: '', adresse: '', codePostal: '', ville: '', pays: 'Tunisie', dateNaissance: '', numeroCIN: '', numeroPermis: ''
      },
      produit: { idProduit: '', type: '', primePersonnalisee: 0, optionsSupplementaires: '' },
      contrat: { dateDebut: '', dureeMois: 12, primePersonnalisee: 0, optionsSupplementaires: '' }
    });
    this.activeStepIndex = 0;
  }

  setStatus(sub: Subscription, status: Subscription['statut']): void {
    if (!sub.idContrat) return;
    this.subscriptionService.updateSubscription(sub.idContrat, { statut: status }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Statut mis à jour' });
        this.loadSubscriptions();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour le statut' });
      }
    });
  }

  getProductIcon(type: string | undefined): string {
    switch (type) {
      case 'SANTE': return 'pi-heart-fill';
      case 'AUTO': return 'pi-car';
      case 'HABITATION': return 'pi-home';
      case 'VIE': return 'pi-user';
      default: return 'pi-shield';
    }
  }

  getProductColor(type: string | undefined): string {
    switch (type) {
      case 'SANTE': return '#ec4899';
      case 'AUTO': return '#3b82f6';
      case 'HABITATION': return '#f59e0b';
      case 'VIE': return '#10b981';
      default: return '#64748b';
    }
  }

  private logInvalidControls(): void {
    const invalid: string[] = [];
    const controls = this.souscriptionForm.controls;
    
    Object.keys(controls).forEach(key => {
      const control = controls[key];
      if (control.invalid) {
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
            if (control.get(subKey)?.invalid) {
              invalid.push(`${key}.${subKey}`);
            }
          });
        } else {
          invalid.push(key);
        }
      }
    });
    
    if (invalid.length > 0) {
      console.warn('Formulaire invalide - Champs manquants ou incorrects:', invalid);
    }
  }
}
