import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, ClientDetails, ProduitDetails } from '../../shared/models/subscription.model';
import { SubscriptionService } from '../../shared/services/subscription.service';
import { ProduitService } from '../../shared/services/produit.service';
import { ClientService } from '../../shared/services/client.service';

@Component({
  selector: 'app-manage-subscription',
  templateUrl: './manage-subscription.component.html',
  styleUrls: ['./manage-subscription.component.css']
})
export class ManageSubscriptionComponent implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];
  searchText = '';
  isLoading = true;
  error = '';

  // Multi-step form state
  activeStep = 1;
  steps = [1, 2, 3, 4];
  produitTypes = ['AUTO', 'HABITATION', 'SANTE', 'VIE'];

  souscriptionForm: FormGroup;
  checkedToast = '';
  products: ProduitDetails[] = [];
  clients: ClientDetails[] = [];

  constructor(
    private subscriptionService: SubscriptionService,
    private produitService: ProduitService,
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.souscriptionForm = this.fb.group({
      client: this.fb.group({
        nom: ['', [Validators.required]],
        prenom: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telephone: ['', [Validators.required, Validators.pattern(/^\d{8,}$/)]],
        adresse: ['', [Validators.required]],
        codePostal: ['', [Validators.required]],
        ville: ['', [Validators.required]],
        pays: ['', [Validators.required]],
        dateNaissance: ['', [Validators.required]],
        numeroCIN: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        numeroPermis: ['', [Validators.required]]
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
    this.loadClients();
  }

  loadSubscriptions(): void {
    this.isLoading = true;
    this.subscriptionService.getAllSubscriptions().subscribe({
      next: (res) => {
        this.subscriptions = res;
        this.filteredSubscriptions = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Impossible de charger les souscriptions.';
        this.isLoading = false;
      }
    });
  }

  loadProducts(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => this.products = res as any,
      error: (err) => console.error('Erreur chargement produits', err)
    });
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (res) => this.clients = res as any,
      error: (err) => console.error('Erreur chargement clients', err)
    });
  }

  nextStep(): void {
    if (this.activeStep < 4) {
      this.activeStep++;
    }
  }

  prevStep(): void {
    if (this.activeStep > 1) {
      this.activeStep--;
    }
  }

  submitSubscription(): void {
    if (this.souscriptionForm.invalid) {
      this.checkedToast = 'Veuillez remplir correctement tous les champs requis.';
      return;
    }

    const value = this.souscriptionForm.value;
    const contrat: Subscription = {
      client: value.client,
      idProduit: value.produit.idProduit,
      produit: this.products.find(p => p.idProduit === value.produit.idProduit) as ProduitDetails,
      dateDebut: value.contrat.dateDebut,
      dureeMois: value.contrat.dureeMois,
      primePersonnalisee: value.contrat.primePersonnalisee,
      optionsSupplementaires: value.contrat.optionsSupplementaires,
      dateFin: new Date(new Date(value.contrat.dateDebut).setMonth(new Date(value.contrat.dateDebut).getMonth() + value.contrat.dureeMois)).toISOString(),
      statut: 'EN_ATTENTE',
      montant: value.contrat.primePersonnalisee
    };

    this.subscriptionService.createFullSubscription(contrat).subscribe({
      next: (res) => {
        this.checkedToast = 'Souscription créée avec succès';
        this.loadSubscriptions();
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.checkedToast = 'Echec de création de la souscription.';
      }
    });
  }

  getProductsByType(): ProduitDetails[] {
    const type = this.souscriptionForm.get('produit.type')?.value;
    return type ? this.products.filter((p) => p.type === type) : this.products;
  }

  resetForm(): void {
    this.souscriptionForm.reset({
      client: {
        nom: '', prenom: '', email: '', telephone: '', adresse: '', codePostal: '', ville: '', pays: '', dateNaissance: '', numeroCIN: '', numeroPermis: ''
      },
      produit: { idProduit: '', type: '', primePersonnalisee: 0, optionsSupplementaires: '' },
      contrat: { dateDebut: '', dureeMois: 12, primePersonnalisee: 0, optionsSupplementaires: '' }
    });
    this.activeStep = 1;
  }

  filterSubscriptions(): void {
    const search = this.searchText.toLowerCase().trim();
    this.filteredSubscriptions = this.subscriptions.filter((sub) =>
      ((sub.client?.nom ?? sub.clientId ?? '') as string).toLowerCase().includes(search) ||
      ((sub.produit?.nomProduit ?? sub.idProduit ?? '') as string).toLowerCase().includes(search) ||
      ((sub.statut ?? '') as string).toLowerCase().includes(search)
    );
  }

  setStatus(sub: Subscription, status: Subscription['statut']): void {
    if (!sub.idContrat) return;
    this.subscriptionService.updateSubscription(sub.idContrat, { statut: status }).subscribe({
      next: () => this.loadSubscriptions(),
      error: (err) => {
        console.error(err);
        this.error = "Impossible de mettre à jour le statut.";
      }
    });
  }
}
