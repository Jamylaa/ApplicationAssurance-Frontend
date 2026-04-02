import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PackService } from '../../shared/services/pack.service';
import { ProduitService } from '../../shared/services/produit.service';
import { Pack } from '../../shared/models/pack.model';
import { Produit } from '../../shared/models/produit.model';

@Component({
  selector: 'app-manage-pack',
  templateUrl: './manage-pack.component.html',
  styleUrl: './manage-pack.component.css'
})
export class ManagePackComponent implements OnInit {
  packs: Pack[] = [];
  produits: Produit[] = [];
  loading = true;
  packForm: FormGroup;
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Packs', link: '/admin/packs' }];

  constructor(
    private packService: PackService,
    private produitService: ProduitService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.packForm = this.fb.group({
      nomPack: ['', Validators.required],
      description: ['', Validators.required],
      prixMensuel: [0, [Validators.required, Validators.min(0)]],
      dureeMinContrat: [12, [Validators.required, Validators.min(1)]],
      dureeMaxContrat: [24, [Validators.required, Validators.min(1)]],
      produitsIds: [[]],
      niveauCouverture: ['basic', Validators.required],
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.loadProduits();
    this.loadPacks();
  }

  loadPacks(): void {
    this.loading = true;
    this.packService.getAllPacks().subscribe({
      next: (res) => {
        this.packs = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading packs', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les packs' });
      }
    });
  }

  loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => this.produits = res,
      error: (err) => console.error('Error loading produits', err)
    });
  }

  onSubmit(): void {
    if (this.packForm.valid) {
      const data = this.packForm.value;
      if (this.isEditing) {
        this.packService.updatePack(this.currentId, data).subscribe({
          next: () => {
            this.loadPacks();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Pack mis à jour' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Mise à jour échouée' })
        });
      } else {
        this.packService.createPack(data).subscribe({
          next: () => {
            this.loadPacks();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Pack créé' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Création échouée' })
        });
      }
    }
  }

  modifier(p: Pack): void {
    this.isEditing = true;
    this.currentId = p.idPack;
    this.packForm.patchValue(p);
    this.showForm = true;
  }

  supprimer(idPack: string): void {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer ce pack ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.packService.deletePack(idPack).subscribe({
          next: () => {
            this.loadPacks();
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Pack supprimé' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression échouée' })
        });
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.packForm.reset({
      prixMensuel: 0,
      dureeMinContrat: 12,
      dureeMaxContrat: 24,
      produitsIds: [],
      niveauCouverture: 'basic',
      actif: true
    });
  }

  getProduitNames(ids: string[] | undefined): string {
    if (!ids || ids.length === 0) return 'Aucun';
    return this.produits
      .filter(p => ids.includes(p.idProduit!))
      .map(p => p.nomProduit)
      .join(', ');
  }
}