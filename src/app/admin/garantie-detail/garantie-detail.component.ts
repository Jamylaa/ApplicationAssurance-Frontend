import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Garantie } from '../../shared/models/garantie.model';
import { GarantieService } from '../../shared/services/garantie.service';

@Component({
  selector: 'app-garantie-detail',
  templateUrl: './garantie-detail.component.html',
  styleUrls: ['./garantie-detail.component.css']
})
export class GarantieDetailComponent implements OnInit {
  garantie?: Garantie;
  error = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private garantieService: GarantieService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant de la garantie manquant';
      this.isLoading = false;
      return;
    }

    this.garantieService.getGarantieById(id).subscribe({
      next: (garantie) => {
        this.garantie = garantie;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Impossible de charger la garantie.";
        this.isLoading = false;
      },
    });
  }

  back(): void {
    this.router.navigate(['/admin/garanties']);
  }

  edit(): void {
    if (!this.garantie?.idGarantie) return;
    this.router.navigate(['/admin/garanties'], { queryParams: { editId: this.garantie.idGarantie } });
  }
}
