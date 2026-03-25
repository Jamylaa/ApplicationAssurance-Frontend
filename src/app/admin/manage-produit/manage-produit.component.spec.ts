import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ManageProduitComponent } from './manage-produit.component';
import { ProduitService } from '../../shared/services/produit.service';
import { GarantieService } from '../../shared/services/garantie.service';

describe('ManageProduitComponent', () => {
  let component: ManageProduitComponent;
  let fixture: ComponentFixture<ManageProduitComponent>;
  const queryParamMapSubject = new BehaviorSubject(convertToParamMap({ editId: 'prodX' }));

  beforeEach(async () => {
    const produitServiceStub = {
      getAllProduits: () => of([{ idProduit: 'prodX', nomProduit: 'ProduitX', description: 'Desc', prixBase: 10, ageMin: 18, ageMax: 65, garantiesIds: [], maladieChroniqueAutorisee: false, diabetiqueAutorise: false, actif: true }]),
      updateProduit: () => of(null),
      createProduit: () => of(null),
      deleteProduit: () => of(null)
    };

    const garantieServiceStub = { getAllGaranties: () => of([]) };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [ManageProduitComponent, BreadcrumbComponent],
      providers: [
        { provide: ProduitService, useValue: produitServiceStub },
        { provide: GarantieService, useValue: garantieServiceStub },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMapSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageProduitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open edit modal when editId is in query params', () => {
    expect(component.showModal).toBeTrue();
    expect(component.isEditing).toBeTrue();
    expect(component.currentId).toBe('prodX');
  });

  it('should reset sort when search is empty', () => {
    component.sortField = 'nomProduit';
    component.sortDirection = 'desc';
    component.searchText = '';
    component.filterProduits();
    expect(component.sortField).toBe('');
    expect(component.sortDirection).toBe('asc');
  });
});
