import { NgModule } from '@angular/core';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelMenuModule } from 'primeng/panelmenu';
import { PasswordModule } from 'primeng/password';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

const PRIME_NG_MODULES = [
  BadgeModule,
  ButtonModule,
  CardModule,
  DialogModule,
  DividerModule,
  DropdownModule,
  InputSwitchModule,
  InputTextModule,
  InputTextareaModule,
  MessageModule,
  MultiSelectModule,
  PanelMenuModule,
  PasswordModule,
  TableModule,
  ToastModule
];

@NgModule({
  imports: PRIME_NG_MODULES,
  exports: PRIME_NG_MODULES
})
export class PrimeNgModule {}
