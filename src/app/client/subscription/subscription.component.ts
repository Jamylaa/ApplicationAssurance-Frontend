import { Component, OnInit } from '@angular/core';
import { PackService } from '../../shared/services/pack.service';
import { Pack } from '../../shared/models/pack.model';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  packs: Pack[] = [];
  selectedPack: Pack | null = null;
  step = 1;

  constructor(private packService: PackService) {}

  ngOnInit(): void {  this.loadPacks();}

  loadPacks(): void {
    this.packService.getAllPacks().subscribe({
      next: (res) => this.packs = res.filter(p => p.actif),
      error: (err) => console.error('Error loading packs', err)
    });
  }

  selectPack(pack: Pack): void {
    this.selectedPack = pack;
    this.step = 2;
  }

  confirmSubscription(): void {
     alert('Souscription confirmée pour le pack : ' + this.selectedPack?.nomPack);
    this.step = 3;
  }
}