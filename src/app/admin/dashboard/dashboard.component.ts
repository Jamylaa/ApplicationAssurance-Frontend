import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin, of, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { GarantieService } from '../../shared/services/garantie.service';
import { PackService } from '../../shared/services/pack.service';
import { ProduitService } from '../../shared/services/produit.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  packsCount = 0;
  produitsCount = 0;
  garantiesCount = 0;
  private readonly refreshIntervalMs = 15000;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private packService: PackService,
    private produitService: ProduitService,
    private garantieService: GarantieService
  ) {}

  ngOnInit(): void {
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startAutoRefresh(): void {
    timer(0, this.refreshIntervalMs)
      .pipe(
        switchMap(() =>
          forkJoin({
            packs: this.packService.getAllPacks().pipe(catchError(() => of([]))),
            produits: this.produitService.getAllProduits().pipe(catchError(() => of([]))),
            garanties: this.garantieService.getAllGaranties().pipe(catchError(() => of([])))
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(({ packs, produits, garanties }) => {
        this.packsCount = packs.length;
        this.produitsCount = produits.length;
        this.garantiesCount = garanties.length;
      });
  }

  logout() {
    this.authService.logout();
  }
}
