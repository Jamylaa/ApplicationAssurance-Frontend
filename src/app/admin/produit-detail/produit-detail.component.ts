import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Produit } from '../../shared/models/produit.model';
import { ProduitService } from '../../shared/services/produit.service';
import { Garantie } from '../../shared/models/garantie.model';
import { GarantieService } from '../../shared/services/garantie.service';

@Component({
  selector: 'app-produit-detail',
  templateUrl: './produit-detail.component.html',
  styleUrls: ['./produit-detail.component.css']
})
export class ProduitDetailComponent implements OnInit {
  produit?: Produit;
  garanties: Garantie[] = [];
  err = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitService: ProduitService,
    private garantieService: GarantieService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.err = 'Identifiant du produit manquant';
      this.isLoading = false;
      return;
    }

    this.garantieService.getAllGaranties().subscribe({
      next: (garanties) => {
        this.garanties = garanties;
        this.loadProduit(id);
      },
      error: (err) => {
        console.error(err);
        this.err = "Impossible de charger les garanties.";
        this.isLoading = false;
      },
    });
  }

  private loadProduit(id: string): void {
    this.produitService.getProduitById(id).subscribe({
      next: (produit) => {
        this.produit = produit;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.err = "Impossible de charger le produit.";
        this.isLoading = false;
      },
    });
  }

  getGarantiesNames(ids: string[] = []): string {
    if (!ids || ids.length === 0) return 'Aucune';
    return this.garanties
      .filter((g) => ids.includes(g.idGarantie!))
      .map((g) => g.nomGarantie)
      .join(', ');
  }

  back(): void {
    this.router.navigate(['/admin/produits']);
  }

  edit(): void {
    if (!this.produit?.idProduit) return;
    this.router.navigate(['/admin/produits'], { queryParams: { editId: this.produit.idProduit } });
  }
}
