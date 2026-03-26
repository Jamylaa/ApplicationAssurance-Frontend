import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageProduitComponent } from './manage-produit/manage-produit.component';
import { ProduitDetailComponent } from './produit-detail/produit-detail.component';
import { ManagePackComponent } from './manage-pack/manage-pack.component';
import { PackDetailComponent } from './pack-detail/pack-detail.component';
import { ManageGarantieComponent } from './manage-garantie/manage-garantie.component';
import { GarantieDetailComponent } from './garantie-detail/garantie-detail.component';
import { ManageClientComponent } from './manage-client/manage-client.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ManageSubscriptionComponent } from './manage-subscription/manage-subscription.component';
import { AdminChatComponent } from './admin-chat/admin-chat.component';
import { RecommendationChatComponent } from './recommendation-chat/recommendation-chat.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { UnifiedChatbotComponent } from './unified-chatbot/unified-chatbot.component';
import { PrimeNgModule } from '../shared/primeng.module';

@NgModule({
  declarations: [
    DashboardComponent,
    ManageProduitComponent,
    ManagePackComponent,
    PackDetailComponent,
    ManageGarantieComponent,
    GarantieDetailComponent,
    ManageClientComponent,
    ClientDetailComponent,
    ManageSubscriptionComponent,
    AdminChatComponent,
    RecommendationChatComponent,
    ProfileComponent,
    SettingsComponent,
    SidebarComponent,
    ProduitDetailComponent,
    NavbarComponent,
    AdminLayoutComponent,
    UnifiedChatbotComponent
  ],
  exports: [
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    PrimeNgModule,
    BreadcrumbComponent
  ]
})
export class AdminModule { }
