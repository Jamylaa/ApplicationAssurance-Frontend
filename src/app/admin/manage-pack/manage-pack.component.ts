import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  filteredPacks: Pack[] = [];
  produits: Produit[] = [];
  searchText = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  packForm: FormGroup;
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Packs', link: '/admin/packs' }];
  pendingEditId?: string;

  constructor(
    private packService: PackService,
    private produitService: ProduitService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
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
    this.route.queryParamMap.subscribe((params) => {
      const editId = params.get('editId');
      if (editId) {
        this.pendingEditId = editId;
      }
    });

    this.loadProduits();
    this.loadPacks();
  }

  loadPacks(): void {
    this.packService.getAllPacks().subscribe({
      next: (res) => {
        this.packs = res;
        this.filteredPacks = res;

        if (this.pendingEditId) {
          const pack = this.packs.find((p) => p.idPack === this.pendingEditId);
          if (pack) {
            this.modifier(pack);
            this.showForm = true;
          }
          this.pendingEditId = undefined;
          this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
        }
      },
      error: (err) => console.error('Error loading packs', err)
    });
  }

  loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => this.produits = res,
      error: (err) => console.error('Error loading produits', err)
    });
  }

  filterPacks(): void {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      this.filteredPacks = [...this.packs];
      this.sortField = '';
      this.sortDirection = 'asc';
      return;
    }

    this.filteredPacks = this.packs.filter((p) =>
      p.nomPack.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );

    if (this.sortField) {
      this.sortPacks(this.sortField as keyof Pack);
    }
  }

  sortPacks(field: keyof Pack): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredPacks = [...this.filteredPacks].sort((a, b) => {
      const aVal = a[field] as any;
      const bVal = b[field] as any;

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSubmit(): void {
    if (this.packForm.valid) {
      const data = this.packForm.value;
      if (this.isEditing) {
        this.packService.updatePack(this.currentId, data).subscribe(() => {
          this.loadPacks();
          this.resetForm();
          this.showForm = false;
          window.location.reload();
        });
      } else {
        this.packService.createPack(data).subscribe(() => {
          this.loadPacks();
          this.resetForm();
          this.showForm = false;
          window.location.reload();
        });
      }
    }
  }

  modifier(p: Pack): void {
    this.isEditing = true;
    this.currentId = p.idPack;
    this.packForm.patchValue(p);
    this.showForm = true; }

  supprimer(idPack: any): void {
    if (confirm('Supprimer ce pack ?')) {
      this.packService.deletePack(idPack).subscribe(() => {
        this.loadPacks();
        this.packs = this.packs.filter(p => p.idPack !== idPack);
        window.location.reload();
      });
    }
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

  getProduitNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'Aucun';
    return this.produits
      .filter(p => ids.includes(p.idProduit!))
      .map(p => p.nomProduit)
      .join(', '); }
}