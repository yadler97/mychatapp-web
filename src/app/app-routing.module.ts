import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MychatappComponent } from './mychatapp/mychatapp.component';
import { LoginComponent } from './login/login.component';
import { ChangelogComponent } from './changelog/changelog.component';

const routes: Routes = [
  { path: '', component: MychatappComponent },
  { path: 'login', component: LoginComponent },
  { path: 'changelog', component: ChangelogComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
