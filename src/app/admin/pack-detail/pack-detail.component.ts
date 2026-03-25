import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pack } from '../../shared/models/pack.model';
import { PackService } from '../../shared/services/pack.service';
import { Produit } from '../../shared/models/produit.model';
import { ProduitService } from '../../shared/services/produit.service';
@Component({
  selector: 'app-pack-detail',
  templateUrl: './pack-detail.component.html',
  styleUrls: ['./pack-detail.component.css']
})
export class PackDetailComponent implements OnInit {
  pack?: Pack;
  produits: Produit[] = [];
  error = '';
  isLoading = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private packService: PackService,
    private produitService: ProduitService
  ) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant du pack manquant';
      this.isLoading = false;
      return;
    }
    this.produitService.getAllProduits().subscribe({
      next: (produits) => {
        this.produits = produits;
        this.loadPack(id);
      },
      error: (err) => {
        console.error(err);
        this.error = "Impossible de charger les produits.";
        this.isLoading = false;
      },
    });
  }
  private loadPack(id: string): void {
    this.packService.getPackById(id).subscribe({
      next: (pack) => {
        this.pack = pack;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Impossible de charger le pack.";
        this.isLoading = false;
      },
    });
  }
   getProduitNames(ids: string[] = []): string {
    if (!ids || ids.length === 0) return 'Aucun';
    return this.produits
      .filter((p) => ids.includes(p.idProduit!))
      .map((p) => p.nomProduit)
      .join(', ');
  }
  back(): void {
    this.router.navigate(['/admin/packs']);
  }
  edit(): void {
    if (!this.pack?.idPack) return;
    this.router.navigate(['/admin/packs'], { queryParams: { editId: this.pack.idPack } });
  }
}