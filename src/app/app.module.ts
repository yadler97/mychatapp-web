import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

//import { environment_mca } from '../environments/environment_mca';
import { environment_dev } from '../environments/environment_dev';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MychatappComponent } from './mychatapp/mychatapp.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';

import * as firebase from 'firebase/app';
import { ChangelogComponent } from './changelog/changelog.component';

import { HttpClientModule } from '@angular/common/http';
import { TranslateService } from './translate.service';
import { TranslatePipe } from './translate.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export function setupTranslateFactory(
  service: TranslateService): Function {
  return () => service.use(navigator.language.substring(0, 2));
}

@NgModule({
  declarations: [
    AppComponent,
    MychatappComponent,
    LoginComponent,
    ChangelogComponent,
    TranslatePipe
  ],
  imports: [
    BrowserModule,
    NgbModule,
    AppRoutingModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggleModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    TranslateService,
    {
      provide: APP_INITIALIZER,
      useFactory: setupTranslateFactory,
      deps: [ TranslateService ],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {         
    //firebase.initializeApp(environment_mca.firebase);
    firebase.initializeApp(environment_dev.firebase);
  }
}