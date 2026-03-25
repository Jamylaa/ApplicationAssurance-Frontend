import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePackComponent } from './manage-pack.component';

describe('ManagePackComponent', () => {
  let component: ManagePackComponent;
  let fixture: ComponentFixture<ManagePackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePackComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManagePackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
