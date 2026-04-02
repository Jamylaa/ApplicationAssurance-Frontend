import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      expanded: true,
      items: [
        {
          label: 'Tableau de bord',
          icon: 'pi pi-chart-bar',
          routerLink: ['/admin/dashboard']
        }
      ]
    },
    {
      label: 'Clients',
      icon: 'pi pi-users',
      expanded: true,
      items: [
        {
          label: 'Gestion des clients',
          icon: 'pi pi-user-edit',
          routerLink: ['/admin/clients']
        }
      ]
    },
    {
      label: 'Garantie / Produit / Pack',
      icon: 'pi pi-box',
      expanded: true,
      items: [
        {
          label: 'Garanties',
          icon: 'pi pi-shield',
          routerLink: ['/admin/garanties']
        },
        {
          label: 'Produits',
          icon: 'pi pi-briefcase',
          routerLink: ['/admin/produits']
        },
        {
          label: 'Packs',
          icon: 'pi pi-inbox',
          routerLink: ['/admin/packs']
        }
      ]
    },
    {
      label: 'Souscriptions',
      icon: 'pi pi-file-check',
      expanded: true,
      items: [
        {
          label: 'Gestion des souscriptions',
          icon: 'pi pi-check-square',
          routerLink: ['/admin/subscriptions']
        }
      ]
    },
    {
      label: 'Assistance IA',
      icon: 'pi pi-sparkles',
      expanded: true,
      items: [
        {
          label: 'Assistance création',
          icon: 'pi pi-wand',
          routerLink: ['/admin/chat']
        },
        {
          label: 'Recommendation',
          icon: 'pi pi-comments',
          routerLink: ['/admin/recommendation-chat']
        }
      ]
    }
  ];
}