import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '../../shared/models/client.model';
import { ClientService } from '../../shared/services/client.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css']
})
export class ClientDetailComponent implements OnInit {
  client?: Client;
  error = '';
  isLoading = true;
  breadcrumbItems: { label: string; link?: string }[] = [{ label: 'Clients', link: '/admin/clients' }];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant du client manquant';
      this.isLoading = false;
      return;
    }

    this.clientService.getClientById(id).subscribe({
      next: (client) => {
        this.client = client;
        this.breadcrumbItems = [
          { label: 'Clients', link: '/admin/clients' },
          { label: client.userName }
        ];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Impossible de charger le client.";
        this.isLoading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/admin/clients']);
  }

  edit(): void {
    if (!this.client?.idUser) return;
    this.router.navigate(['/admin/clients'], { queryParams: { editId: this.client.idUser } });
  }

  delete(): void {
    if (!this.client?.idUser) return;
    if (!confirm('Supprimer ce client ?')) return;

    this.clientService.deleteClient(this.client.idUser).subscribe({
      next: () => this.router.navigate(['/admin/clients']),
      error: (err) => {
        console.error(err);
        this.error = "Impossible de supprimer le client.";
      }
    });
  }
}
