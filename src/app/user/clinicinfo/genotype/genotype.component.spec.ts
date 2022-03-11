import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenotypeComponent } from './genotype.component';

describe('GenotypeComponent', () => {
  let component: GenotypeComponent;
  let fixture: ComponentFixture<GenotypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenotypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenotypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
