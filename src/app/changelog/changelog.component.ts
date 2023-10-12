import { Component, OnInit } from '@angular/core';
import { appname } from '../../environments/appname';

@Component({
  selector: 'app-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.scss']
})

export class ChangelogComponent implements OnInit {

  appname: string = appname;
  theme: string;

  constructor() { 
    this.theme = this.getCookie("theme");
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  ngOnInit() {
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
}
