import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { GarantieService } from '../../shared/services/garantie.service';
import { Garantie } from '../../shared/models/garantie.model';

@Component({
  selector: 'app-manage-garantie',
  templateUrl: './manage-garantie.component.html',
  styleUrl: './manage-garantie.component.css'
})
export class ManageGarantieComponent implements OnInit {
  garanties: Garantie[] = [];
  loading = true;
  garantieForm: FormGroup;
  isEditing = false;
  currentId: any = null;
  showForm = false;
  breadcrumbItems = [{ label: 'Garanties', link: '/admin/garanties' }];

  constructor(
    private garantieService: GarantieService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
    this.loadGaranties();
  }

  loadGaranties(): void {
    this.loading = true;
    this.garantieService.getAllGaranties().subscribe({
      next: (res) => {
        this.garanties = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading garanties', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les garanties' });
      }
    });
  }

  onSubmit(): void {
    if (this.garantieForm.valid) {
      const data = this.garantieForm.value;
      if (this.isEditing) {
        this.garantieService.updateGarantie(this.currentId, data).subscribe({
          next: () => {
            this.loadGaranties();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Garantie mise à jour' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Mise à jour échouée' })
        });
      } else {
        this.garantieService.createGarantie(data).subscribe({
          next: () => {
            this.loadGaranties();
            this.resetForm();
            this.showForm = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Garantie créée' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Création échouée' })
        });
      }
    }
  }

  modifier(g: Garantie): void {
    this.isEditing = true;
    this.currentId = g.idGarantie;
    this.garantieForm.patchValue(g);
    this.showForm = true;
  }

  supprimer(idGarantie: string): void {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer cette garantie ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.garantieService.deleteGarantie(idGarantie).subscribe({
          next: () => {
            this.loadGaranties();
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Garantie supprimée' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression échouée' })
        });
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentId = null;
    this.garantieForm.reset({
      plafondAnnuel: 0,
      tauxCouverture: 70,
      actif: true
    });
  }
}