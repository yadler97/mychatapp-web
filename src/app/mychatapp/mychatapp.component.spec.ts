import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MychatappComponent } from './mychatapp.component';

describe('MychatappComponent', () => {
  let component: MychatappComponent;
  let fixture: ComponentFixture<MychatappComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MychatappComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MychatappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
