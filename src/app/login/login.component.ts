import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { Router } from '@angular/router';
import { appname } from '../../environments/appname';
import { TranslateService } from '../translate.service';
import { TranslatePipe } from '../translate.pipe';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [TranslatePipe]
})
export class LoginComponent implements OnInit {

  appname: string = appname;
  theme: string;

  constructor(private titleService: Title, public router: Router, private translate: TranslateService, public translatepipe: TranslatePipe) { 
    this.titleService.setTitle(appname + " - Login");

    this.theme = this.getCookie("theme");
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  ngOnInit() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified) {
          this.router.navigate(['']);
        }
      } else {
        console.log("fail");
      }
    });
  }

  public login(email: string, password: string, passwordfield: HTMLObjectElement): void {
    let mAuth = firebase.auth();

    if (password == "") {
      passwordfield.setCustomValidity(this.translatepipe.transform("ENTER PASSWORD"));
    }

    mAuth.signInWithEmailAndPassword(email, password).then(success => {
      mAuth.onAuthStateChanged(user => {
        if (user.emailVerified) {
          this.router.navigate(['']);
        } else {
          let modal = document.getElementById("resendModal");
          modal.style.display = "block";
        }
      })
    }).catch(error => {
      if (email != "" && password != "") {
        passwordfield.setCustomValidity(this.translatepipe.transform("PASSWORD OR EMAIL WRONG"));
      }
    })
  }

  public resendEmail() {
    firebase.auth().onAuthStateChanged(user => {
      user.sendEmailVerification();
      let modal = document.getElementById("resendModal");
      modal.style.display = "none";
    })
  }

  public cancelResendingEmail() {
    let modal = document.getElementById("resendModal");
    modal.style.display = "none";
    firebase.auth().signOut();
  }

  private getCookie(name: string) {
    let ca: Array<string> = document.cookie.split(';');
    let caLen: number = ca.length;
    let cookieName = `${name}=`;
    let c: string;

    for (let i: number = 0; i < caLen; i += 1) {
      c = ca[i].replace(/^\s+/g, '');
      if (c.indexOf(cookieName) == 0) {
        return c.substring(cookieName.length, c.length);
      }
    }
    return '';
  }

  public setCustomValidityInTemplate() {
    let inputelement = document.getElementById('emailinput') as HTMLObjectElement
    inputelement.setCustomValidity(this.translatepipe.transform("ENTER EMAIL"));
  }
}