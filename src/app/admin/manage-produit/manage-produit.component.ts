import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProduitService } from '../../shared/services/produit.service';
import { GarantieService } from '../../shared/services/garantie.service';
import { Produit, ProduitType } from '../../shared/models/produit.model';
import { Garantie } from '../../shared/models/garantie.model';

@Component({
  selector: 'app-manage-produit',
  templateUrl: './manage-produit.component.html',
  styleUrl: './manage-produit.component.css'
})
export class ManageProduitComponent implements OnInit {
  produits: Produit[] = [];
  garanties: Garantie[] = [];
  loading = true;
  produitForm: FormGroup;
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Produits', link: '/admin/produits' }];
  produitTypes: { label: string; value: ProduitType }[] = [
    { label: 'Santé', value: 'SANTE' },
    { label: 'Auto', value: 'AUTO' },
    { label: 'Habitation', value: 'HABITATION' }
  ];

  constructor(
    private produitService: ProduitService,
    private garantieService: GarantieService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.produitForm = this.fb.group({
      nomProduit: ['', Validators.required],
      type: ['SANTE', Validators.required],
      description: ['', Validators.required],
      prixBase: [0, [Validators.required, Validators.min(0)]],
      ageMin: [0, [Validators.required, Validators.min(0)]],
      ageMax: [100, [Validators.required, Validators.min(0)]],
      garantiesIds: [[]],
      maladieChroniqueAutorisee: [false],
      diabetiqueAutorise: [false],
      actif: [true]
    });
  }
  ngOnInit(): void {
    this.loadGaranties();
    this.loadProduits();
  }

  loadProduits(): void {
    this.loading = true;
    this.produitService.getAllProduits().subscribe({
      next: (res) => {
        this.produits = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading produits', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les produits' });
      }
    });
  }

  loadGaranties(): void {
    this.garantieService.getAllGaranties().subscribe({
      next: (res) => this.garanties = res,
      error: (err) => console.error('Error loading garanties', err)
    });
  }

  onSubmit(): void {
    if (this.produitForm.valid) {
      const data = this.produitForm.value;
      if (this.isEditing) {
        this.produitService.updateProduit(this.currentId, data).subscribe({
          next: () => {
            this.loadProduits();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Produit mis à jour' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Mise à jour échouée' })
        });
      } else {
        this.produitService.createProduit(data).subscribe({
          next: () => {
            this.loadProduits();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Produit créé' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Création échouée' })
        });
      }
    }
  }

  modifier(p: Produit): void {
    this.isEditing = true;
    this.currentId = p.idProduit;
    this.produitForm.patchValue(p);
    this.showForm = true;
  }

  supprimer(idProduit: string): void {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer ce produit ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.produitService.deleteProduit(idProduit).subscribe({
          next: () => {
            this.loadProduits();
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Produit supprimé' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression échouée' })
        });
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.produitForm.reset({
      type: 'SANTE',
      prixBase: 0,
      ageMin: 0,
      ageMax: 100,
      garantiesIds: [],
      maladieChroniqueAutorisee: false,
      diabetiqueAutorise: false,
      actif: true
    });
  }

  getTypeLabel(type: ProduitType | string | undefined): string {
    switch (type) {
      case 'AUTO': return 'Auto';
      case 'HABITATION': return 'Habitation';
      case 'SANTE': default: return 'Santé';
    }
  }

  getGarantieNames(ids: string[] | undefined): string {
    if (!ids || ids.length === 0) return 'Aucune';
    return this.garanties
      .filter(g => ids.includes(g.idGarantie!))
      .map(g => g.nomGarantie)
      .join(', ');
  }
}
