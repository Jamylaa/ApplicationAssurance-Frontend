import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ManageClientComponent } from './manage-client.component';
import { ClientService } from '../../shared/services/client.service';

describe('ManageClientComponent', () => {
  let component: ManageClientComponent;
  let fixture: ComponentFixture<ManageClientComponent>;

  beforeEach(async () => {
    const clientServiceStub = {
      getAllClients: () => of([]),
      updateClient: () => of(null),
      createClient: () => of(null),
      deleteClient: () => of(null)
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [ManageClientComponent, BreadcrumbComponent],
      providers: [
        { provide: ClientService, useValue: clientServiceStub },
        { provide: ActivatedRoute, useValue: { queryParamMap: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
