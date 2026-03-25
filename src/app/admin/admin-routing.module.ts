import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageProduitComponent } from './manage-produit/manage-produit.component';
import { ManagePackComponent } from './manage-pack/manage-pack.component';
import { ManageGarantieComponent } from './manage-garantie/manage-garantie.component';
import { ManageClientComponent } from './manage-client/manage-client.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ManageSubscriptionComponent } from './manage-subscription/manage-subscription.component';
import { AdminChatComponent } from './admin-chat/admin-chat.component';
import { RecommendationChatComponent } from './recommendation-chat/recommendation-chat.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { PackDetailComponent } from './pack-detail/pack-detail.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';
import { GarantieDetailComponent } from './garantie-detail/garantie-detail.component';
import { UnifiedChatbotComponent } from './unified-chatbot/unified-chatbot.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { breadcrumb: 'Tableau de bord' } },
      {
        path: 'produits',
        children: [
          { path: '', component: ManageProduitComponent, data: { breadcrumb: 'Produits' } },
          { path: ':id', component: ProduitDetailComponent, data: { breadcrumb: 'Details Produit' } }
        ]
      },
      {
        path: 'packs',
        children: [
          { path: '', component: ManagePackComponent, data: { breadcrumb: 'Packs' } },
          { path: ':id', component: PackDetailComponent, data: { breadcrumb: 'Details Pack' } }
        ]
      },
      {
        path: 'garanties',
        children: [
          { path: '', component: ManageGarantieComponent, data: { breadcrumb: 'Garanties' } },
          { path: ':id', component: GarantieDetailComponent, data: { breadcrumb: 'Details Garantie' } }
        ]
      },
      {
        path: 'clients',
        children: [
          { path: '', component: ManageClientComponent, data: { breadcrumb: 'Clients' } },
          { path: ':id', component: ClientDetailComponent, data: { breadcrumb: 'Details Client' } }
        ]
      },
      { path: 'subscriptions', component: ManageSubscriptionComponent, data: { breadcrumb: 'Souscriptions' } },
      { path: 'chat', component: AdminChatComponent, data: { breadcrumb: 'Chat Creation' } },
      { path: 'recommendation-chat', component: RecommendationChatComponent, data: { breadcrumb: 'Chat Recommandation' } },
      { path: 'unified-chat', component: UnifiedChatbotComponent, data: { breadcrumb: 'Assistant Unifie' } },
      { path: 'profile', component: ProfileComponent, data: { breadcrumb: 'Profil' } },
      { path: 'settings', component: SettingsComponent, data: { breadcrumb: 'Parametres' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}

