import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { InputTextModule } from 'primeng/inputtext';
@NgModule({
  declarations: [
    DashboardComponent,
    ChatbotComponent,
    SubscriptionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ClientRoutingModule
  ]
})
export class ClientModule { }
