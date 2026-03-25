import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitService } from '../../shared/services/produit.service';
import { GarantieService } from '../../shared/services/garantie.service';
import { Produit } from '../../shared/models/produit.model';
import { Garantie } from '../../shared/models/garantie.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
@Component({
  selector: 'app-manage-produit',
  templateUrl: './manage-produit.component.html',
  styleUrl: './manage-produit.component.css'
})
export class ManageProduitComponent implements OnInit {
  produits: Produit[] = [];
  filteredProduits: Produit[] = [];
  garanties: Garantie[] = [];
  produitForm: FormGroup;
  searchText = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Produits', link: '/admin/produits' }];
  pendingEditId?: string;

  constructor(
    private produitService: ProduitService,
    private garantieService: GarantieService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.produitForm = this.fb.group({
      nomProduit: ['', Validators.required],
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
    this.route.queryParamMap.subscribe((params) => {
      const editId = params.get('editId');
      if (editId) {
        this.pendingEditId = editId;
      }
    });
    this.loadGaranties();
    this.loadProduits();
  }
  loadProduits(): void {
    this.produitService.getAllProduits().subscribe({
      next: (res) => {
        this.produits = res;
        this.filteredProduits = res;

        if (this.pendingEditId) {
          const product = this.produits.find((p) => p.idProduit === this.pendingEditId);
          if (product) {
            this.modifier(product);
            this.showForm = true;
          }
          this.pendingEditId = undefined;
          this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
        }
      },
      error: (err) => console.error('Error loading produits', err)
    });
  }

  loadGaranties(): void {
    this.garantieService.getAllGaranties().subscribe({
      next: (res) => this.garanties = res,
      error: (err) => console.error('Error loading garanties', err)
    });
  }

  filterProduits(): void {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      this.filteredProduits = [...this.produits];
      this.sortField = '';
      this.sortDirection = 'asc';
      return;
    }

    this.filteredProduits = this.produits.filter((p) =>
      p.nomProduit.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );

    if (this.sortField) {
      this.sortProduits(this.sortField as keyof Produit);
    }
  }

  sortProduits(field: keyof Produit): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredProduits = [...this.filteredProduits].sort((a, b) => {
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
    if (this.produitForm.valid) {
      const data = this.produitForm.value;
      if (this.isEditing) {
        this.produitService.updateProduit(this.currentId, data).subscribe(() => {
          this.loadProduits();
          this.resetForm();
          this.showForm = false;
          window.location.reload(); // force refresh to avoid stale state
        });
      } else {
        this.produitService.createProduit(data).subscribe(() => {
          this.loadProduits();
          this.resetForm();
          this.showForm = false;
          window.location.reload(); // force refresh to avoid stale state
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

  supprimer(idProduit: any): void {
    if (confirm('Supprimer ce produit ?')) {
      this.produitService.deleteProduit(idProduit).subscribe(() => {
        this.loadProduits();
        this.produits = this.produits.filter(p => p.idProduit !== idProduit);
        window.location.reload(); // force reload to refresh list
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.produitForm.reset({
      prixBase: 0,
      ageMin: 0,
      ageMax: 100,
      garantiesIds: [],
      maladieChroniqueAutorisee: false,
      diabetiqueAutorise: false,
      actif: true
    });
  }

  getGarantieNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'Aucune';
    return this.garanties
      .filter(g => ids.includes(g.idGarantie!))
      .map(g => g.nomGarantie)
      .join(', ');
  }
}
