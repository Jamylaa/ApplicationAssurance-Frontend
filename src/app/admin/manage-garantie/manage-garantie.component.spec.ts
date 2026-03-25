import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageGarantieComponent } from './manage-garantie.component';

describe('ManageGarantieComponent', () => {
  let component: ManageGarantieComponent;
  let fixture: ComponentFixture<ManageGarantieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageGarantieComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageGarantieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
