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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TabViewModule } from 'primeng/tabview';
import { StepsModule } from 'primeng/steps';
import { ToolbarModule } from 'primeng/toolbar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { InputMaskModule } from 'primeng/inputmask';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';

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
  ToastModule,
  ConfirmDialogModule,
  BreadcrumbModule,
  TabViewModule,
  StepsModule,
  ToolbarModule,
  InputNumberModule,
  ConfirmPopupModule,
  ProgressSpinnerModule,
  TooltipModule,
  CheckboxModule,
  AvatarModule,
  InputMaskModule,
  RippleModule,
  TagModule
];

@NgModule({
  imports: PRIME_NG_MODULES,
  exports: PRIME_NG_MODULES
})
export class PrimeNgModule {}
