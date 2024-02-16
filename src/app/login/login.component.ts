import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Router } from '@angular/router';
import { appname } from '../../environments/appname';
import { TranslateService } from '../translate.service';
import { TranslatePipe } from '../translate.pipe';

import firebase from "firebase/compat/app";
import { environment } from '../../environments/environment';

import "firebase/compat/auth";

const app = firebase.initializeApp(environment.firebase);
const auth = firebase.auth(app);

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
    auth.onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified) {
          this.router.navigate(['']);
        }
      } else {
        console.log("fail");
      }
    });
  }

  public login(email: string, password: string, passwordfield: HTMLInputElement): void {
    if (password == "") {
      passwordfield.setCustomValidity(this.translatepipe.transform("ENTER PASSWORD"));
    }

    auth.signInWithEmailAndPassword(email, password).then(success => {
      auth.onAuthStateChanged(user => {
        if (user!.emailVerified) {
          this.router.navigate(['']);
        } else {
          let modal = document.getElementById("resendModal");
          modal!.style.display = "block";
        }
      })
    }).catch(error => {
      if (email != "" && password != "") {
        passwordfield.setCustomValidity(this.translatepipe.transform("PASSWORD OR EMAIL WRONG"));
      }
    })
  }

  public resendEmail() {
    auth.onAuthStateChanged(user => {
      user!.sendEmailVerification().then(() => {
        let modal = document.getElementById("resendModal");
        modal!.style.display = "none";
      });
    })
  }

  public cancelResendingEmail() {
    let modal = document.getElementById("resendModal");
    modal!.style.display = "none";
    auth.signOut();
  }

  public openForgotPasswordModal() {
    document.getElementById("forgotPasswordModal")!.style.display = "block";
  }

  public closeForgotPasswordModal() {
    document.getElementById("forgotPasswordModal")!.style.display = "none";
  }

  public resetPassword(email: string) {
    auth.sendPasswordResetEmail(email).then(success => {
      document.getElementById("forgotPasswordModal")!.style.display = "none";
      this.showToast(this.translatepipe.transform("PASSWORD RESET MAIL SENT"));
    }).catch(error => {
      this.showToast(this.translatepipe.transform("SENDING PASSWORD RESET MAIL FAILED"));
    });
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

  public showToast(message: string) {
    document.getElementById('toast')!.style.display = "block";
    document.getElementById('toasttext')!.innerHTML = message;
    setTimeout(function() {
      document.getElementById('toast')!.style.display = "none";
    }, 2000);
  }
}