import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GarantieService } from '../../shared/services/garantie.service';
import { Garantie } from '../../shared/models/garantie.model';

@Component({
  selector: 'app-manage-garantie',
  templateUrl: './manage-garantie.component.html',
  styleUrl: './manage-garantie.component.css'
})
export class ManageGarantieComponent implements OnInit {
  garanties: Garantie[] = [];
  filteredGaranties: Garantie[] = [];
  searchText = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  garantieForm: FormGroup;
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Garanties', link: '/admin/garanties' }];
  pendingEditId?: string;

  constructor(
    private garantieService: GarantieService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.garantieForm = this.fb.group({
      nomGarantie: ['', Validators.required],
      description: ['', Validators.required],
      plafondAnnuel: [0, [Validators.required, Validators.min(0)]],
      tauxCouverture: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
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
  }

  loadGaranties(): void {
    this.garantieService.getAllGaranties().subscribe({
      next: (res) => {
        this.garanties = res;
        this.filteredGaranties = res;

        if (this.pendingEditId) {
          const garantie = this.garanties.find((g) => g.idGarantie === this.pendingEditId);
          if (garantie) {
            this.modifier(garantie);
            this.showForm = true;
          }
          this.pendingEditId = undefined;
          this.router.navigate([], { queryParams: { editId: null }, queryParamsHandling: 'merge' });
        }
      },
      error: (err) => console.error('Error loading garanties', err)
    });
  }

  filterGaranties(): void {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      this.filteredGaranties = [...this.garanties];
      this.sortField = '';
      this.sortDirection = 'asc';
      return;
    }

    this.filteredGaranties = this.garanties.filter((g) =>
      g.nomGarantie.toLowerCase().includes(search) ||
      g.description.toLowerCase().includes(search)
    );

    if (this.sortField) {
      this.sortGaranties(this.sortField as keyof Garantie);
    }
  }

  sortGaranties(field: keyof Garantie): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredGaranties = [...this.filteredGaranties].sort((a, b) => {
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
    if (this.garantieForm.valid) {
      const data = this.garantieForm.value;
      if (this.isEditing) {
        this.garantieService.updateGarantie(this.currentId, data).subscribe(() => {
          this.loadGaranties();
          this.resetForm();
          this.showForm = false;
          window.location.reload();
        });
      } else {
        this.garantieService.createGarantie(data).subscribe(() => {
          this.loadGaranties();
          this.resetForm();
          this.showForm = false;
          window.location.reload();
        });
      }
    }
  }

  modifier(g: Garantie): void {
    this.isEditing = true;
    this.currentId = g.idGarantie;
    this.garantieForm.patchValue(g);
    this.showForm = true;}

  supprimer(idarantie: any): void {
    if (confirm('Voulez-vous vraiment supprimer cette garantie ?')) {
      this.garantieService.deleteGarantie(idarantie).subscribe(() => {
        this.loadGaranties();
        this.garanties = this.garanties.filter(g => g.idGarantie !== idarantie);
        window.location.reload();
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.garantieForm.reset({ 
      plafondAnnuel: 0, 
      tauxCouverture: 70, 
      actif: true   });  }
}