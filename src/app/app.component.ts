import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mychatapp-web';

  ngOnInit() {
    const lang = navigator.language.substring(0, 2);
    if (["de"].includes(lang)) {
      this.document.documentElement.lang = lang;
    } else {
      this.document.documentElement.lang = "en";
    }
  }

  constructor(@Inject(DOCUMENT) private document: Document) {}
}
