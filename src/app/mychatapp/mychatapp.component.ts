import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, pipe } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appname } from '../../environments/appname';
import { TranslateService } from '../translate.service';
import { TranslatePipe } from '../translate.pipe';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';
import 'firebase/database';
import { FormControl } from '@angular/forms';

class Room {
  constructor(public key: String, public name: String, public caty: String, public time: String, public passwd: String, public admin: String, public desc: String, public newestMessage: Message, public img: String) { }
}

class Message {
  constructor(public key: String, public msg: String, public img: String, public name: String, public time: String, public quote: String, public pin: String, public userid: String, public pb_url: String, public displayTime: String, public quotedMessage: Message) {}
}

class User {
  constructor(public key: String, public name: String, public bio: String, public bday: String, public loc: String, public favc: String, public ownpi: String, public profile_image: String, public profile_banner: String) {}
}

const mca_firebase = firebase;

let roomlist: Array<Room> = [];
let messagelist: Array<Message> = [];
let userlist: Array<User> = [];
let userid: string;

@Component({
  selector: 'app-mychatapp',
  templateUrl: './mychatapp.component.html',
  styleUrls: ['./mychatapp.component.scss'],
  providers: [TranslatePipe]
})

export class MychatappComponent implements OnInit {

  appname: string = appname;
  theme: string;

  userid: string = null;
  currentUser: User = null;
  displayUser: User = null;

  cm_message: string;
  quote: string = "";

  room_image: string = "";
  profile_image: string = "";
  profile_banner: string = "";

  changethemeevent = new FormControl();
  hide: boolean;

  ngOnInit() {
    mca_firebase.auth().onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified) {
          userid = user.uid;
          this.userid = user.uid;
        } else {
          mca_firebase.auth().signOut;
          this.router.navigate(['login']);
        }
      } else {
        this.router.navigate(['login']);
      }
    });
  }

  roomkey: string = "";
  messageRef = mca_firebase.database().ref('/rooms');

  ngOnDestroy() {
    let roomRef = mca_firebase.database().ref('/rooms');
    roomRef.off("child_added");
  }

  items: BehaviorSubject<Room[]> = new BehaviorSubject<Room[]>([]);
  items_messages: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>([]);

  constructor(private titleService: Title, public router: Router, private translate: TranslateService, public translatepipe: TranslatePipe) { 
    this.titleService.setTitle(appname);

    this.theme = this.getCookie("theme");
    document.documentElement.setAttribute('data-theme', this.theme);

    document.addEventListener('animationstart', function (e) {
      if (e.animationName === 'fadeIn') {
        let target = e.target as HTMLObjectElement
        //target.classList.add('did-fade-in');
      }
    });
    
    document.addEventListener('animationend', function (e) {
      if (e.animationName === 'fadeOut') {
        let target = e.target as HTMLObjectElement
        target.classList.remove('did-fade-in');
       }
    });

    window.onclick = function(event) {
      let modal = document.getElementById("myModal");
      if (event.target == modal) {
        modal.style.display = "none";
      }

      let roommodal = document.getElementById("roomModal");
      if (event.target == roommodal) {
        roommodal.style.display = "none";
      }

      let imagemodal = document.getElementById("imageModal");
      if (event.target == imagemodal) {
        imagemodal.style.display = "none";
      }

      let settingsmodal = document.getElementById("settingsModal");
      if (event.target == settingsmodal) {
        settingsmodal.style.display = "none";
      }

      let forwardmodal = document.getElementById("forwardModal");
      if (event.target == forwardmodal) {
        forwardmodal.style.display = "none";
      }

      let editprofilemodal = document.getElementById("editProfileModal");
      if (event.target == editprofilemodal) {
        editprofilemodal.style.display = "none";
      }

      let contextmenu = document.getElementById("contextmenu");
      contextmenu.style.display = "none";
    }

    let userRef = mca_firebase.database().ref('/users');
    userlist = [];
    userRef.on("child_added", (snapshot, prevChildKey) => {
      let userData = snapshot.val();
      let name = userData.name;
      let bio = userData.bio;
      let bday = userData.bday;
      bday = bday.substring(6, 8) + "." + bday.substring(4, 6) + "." + bday.substring(0, 4);
      let loc = userData.loc;
      let favc = userData.favc;
      let ownpi = userData.ownpi;
      let img = userData.img;
      let banner = userData.banner;

      let u = new User(snapshot.key, name, bio, bday, loc, favc, ownpi, "", "");
      userlist.push(u);
      if (u.key == userid) {
        this.currentUser = u;
      }

      let storage_images = mca_firebase.storage().ref('/profile_images').child(img);
      storage_images.getDownloadURL().then(url_image => {
        userlist.find(x => x.key == snapshot.key).profile_image = url_image;
        if (snapshot.key == userid) {
          this.currentUser.profile_image = url_image;
        }
        let storage_banners = mca_firebase.storage().ref('/profile_banners').child(banner);
        storage_banners.getDownloadURL().then(url_banner => {
          userlist.find(x => x.key == snapshot.key).profile_banner = url_banner;
          if (snapshot.key == userid) {
            this.currentUser.profile_banner = url_banner;
          }
        }).catch(error => {
          switch (error.code) {
            case 'storage/object-not-found':
              break;
          }
        })
      })
    })

    let roomRef = mca_firebase.database().ref('/rooms');
    roomlist = [];
    roomRef.on("child_added", function(snapshot, prevChildKey) {
      let roomdataref = roomRef.child(snapshot.key).child("-0roomdata");
      roomdataref.once("value").then(function(roomdataSnapshot) {
        let roomData = roomdataSnapshot.val();
        let name = roomData.name;
        let admin = roomData.admin;
        let caty = roomData.caty;
        let time = roomData.time;
        let passwd = roomData.passwd;
        let desc = roomData.desc;
        let room_image = roomData.img;
        let now = new Date();
        let year = String(now.getUTCFullYear());
        let month = (now.getUTCMonth()+1 < 10) ? "0" + String(now.getUTCMonth()+1) : String(now.getUTCMonth()+1);
        let day = (now.getUTCDate() < 10) ? "0" + String(now.getUTCDate()) : String(now.getUTCDate());
        let hours = (now.getUTCHours() < 10) ? "0" + String(now.getUTCHours()) : String(now.getUTCHours());
        let minutes = (now.getUTCMinutes() < 10) ? "0" + String(now.getUTCMinutes()) : String(now.getUTCMinutes());
        let seconds = (now.getUTCSeconds() < 10) ? "0" + String(now.getUTCSeconds()) : String(now.getUTCSeconds());
        let utc_timestamp = year + month + day + "_" + hours + minutes + seconds + "_UTC";

        let displaytime;
        let date = new Date(time.substring(0, 4) + '-' + time.substring(4, 6) + '-' +  time.substring(6, 8) + 'T' +  time.substring(9, 11) + ':' + time.substring(11, 13) + ':' + time.substring(13, 15) + '.000Z')
        let display_year = String(date.getFullYear());
        let display_month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
        let display_day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
        let display_hour = (date.getHours() < 10) ? "0" + String(date.getHours()) : String(date.getHours());
        let display_minutes = (date.getMinutes() < 10) ? "0" + String(date.getMinutes()) : String(date.getMinutes());
        if (display_year + display_month + display_day == utc_timestamp.substring(0,8)) {
          displaytime = display_hour + ":" + display_minutes;
        } else {
          displaytime = display_day + "." + display_month + "." + display_year;
        }

        let newestMessageRef = roomRef.child(snapshot.key).orderByKey().limitToLast(1);

        newestMessageRef.on("child_added", function(nmSnapshot, prevChildKey) {
          roomlist.forEach(room => {
            if (room.key == snapshot.key) {
              if (nmSnapshot.key != "-0roomdata") {
                let newestMessageData = nmSnapshot.val();
                let img = newestMessageData.img;
                let msg = newestMessageData.msg;
                let messageuserid = newestMessageData.name;
                let username = userlist.find(x => x.key == messageuserid).name;
                let pin = newestMessageData.pin;
                let quote = newestMessageData.quote;
                let newesttime = newestMessageData.time;
                let newestdisplaytime;
                let date = new Date(newesttime.substring(0, 4) + '-' + newesttime.substring(4, 6) + '-' +  newesttime.substring(6, 8) + 'T' +  newesttime.substring(9, 11) + ':' + newesttime.substring(11, 13) + ':' + newesttime.substring(13, 15) + '.000Z')
                let display_year = String(date.getFullYear());
                let display_month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
                let display_day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
                let display_hour = (date.getHours() < 10) ? "0" + String(date.getHours()) : String(date.getHours());
                let display_minutes = (date.getMinutes() < 10) ? "0" + String(date.getMinutes()) : String(date.getMinutes());
                if (display_year + display_month + display_day == utc_timestamp.substring(0,8)) {
                  newestdisplaytime = display_hour + ":" + display_minutes;
                } else {
                  newestdisplaytime = display_day + "." + display_month + "." + display_year;
                }
                let m;
                if (img != "") {
                  if (messageuserid == userid) {
                    m = new Message(nmSnapshot.key, translatepipe.transform("YOU SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                  } else {
                    m = new Message(nmSnapshot.key, username + " " + translatepipe.transform("SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                  }
                } else {
                  if (messageuserid == userid) {
                    m = new Message(nmSnapshot.key, translatepipe.transform("YOU") + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                  } else {
                    m = new Message(nmSnapshot.key, username + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                  }
                }
                let oldmessage = roomlist.find(x => x.key == snapshot.key).newestMessage;
                roomlist.find(x => x.key == snapshot.key).newestMessage = m;
                if (oldmessage.key != m.key) {
                  let index = roomlist.indexOf(roomlist.find(x => x.key == snapshot.key));
                  let element = roomlist[index];
                  roomlist.splice(index, 1);
                  roomlist.splice(0, 0, element);
                }
              }
            }
          });
        })

        newestMessageRef.once("value").then(function(newestMessageSnapshot) {
          newestMessageSnapshot.forEach(function(childSnapshot) {
            if (childSnapshot.key != "-0roomdata") {
              let newestMessageData = childSnapshot.val();
              let img = newestMessageData.img;
              let msg = newestMessageData.msg;
              let messageuserid = newestMessageData.name;
              let username = userlist.find(x => x.key == messageuserid).name;
              let pin = newestMessageData.pin;
              let quote = newestMessageData.quote;
              let newesttime = newestMessageData.time;
              let newestdisplaytime;
              let adminname = userlist.find(x => x.key == admin).name;
              let date = new Date(newesttime.substring(0, 4) + '-' + newesttime.substring(4, 6) + '-' +  newesttime.substring(6, 8) + 'T' +  newesttime.substring(9, 11) + ':' + newesttime.substring(11, 13) + ':' + newesttime.substring(13, 15) + '.000Z')
              let display_year = String(date.getFullYear());
              let display_month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
              let display_day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
              let display_hour = (date.getHours() < 10) ? "0" + String(date.getHours()) : String(date.getHours());
              let display_minutes = (date.getMinutes() < 10) ? "0" + String(date.getMinutes()) : String(date.getMinutes());
              if (display_year + display_month + display_day == utc_timestamp.substring(0,8)) {
                newestdisplaytime = display_hour + ":" + display_minutes;
              } else {
                newestdisplaytime = display_day + "." + display_month + "." + display_year;
              }
              let m;
              if (img != "") {
                if (messageuserid == userid) {
                  m = new Message(childSnapshot.key, translatepipe.transform("YOU SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                } else {
                  m = new Message(childSnapshot.key, username + " " + translatepipe.transform("SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                }
              } else {
                if (messageuserid == userid) {
                  m = new Message(childSnapshot.key, translatepipe.transform("YOU") + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                } else {
                  m = new Message(childSnapshot.key, username + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                }
              }
              if (roomlist.length == 0) {
                roomlist.push(new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, ""));
              } else {
                let index = 0;
                let added = false;
                for (let r of roomlist) {
                  if (Number(r.newestMessage.time.substring(0, 8) + r.newestMessage.time.substring(9, 15)) < Number(m.time.substring(0, 8) + m.time.substring(9, 15))) {
                    let newRoom = new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, "");
                    roomlist.splice(index, 0, newRoom);
                    added = true;
                    break;
                  } else {
                    index++;
                  }
                }
                if (added == false) {
                  roomlist.push(new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, ""));
                }
              }
            } else {
              let adminname = userlist.find(x => x.key == admin).name;
              let m;
              if (admin == userid) {
                m = new Message(childSnapshot.key, translatepipe.transform("YOU CREATED THIS ROOM"), null, admin, time, null, null, null, null, displaytime, null);
              } else {
                m = new Message(childSnapshot.key, adminname + " " + translatepipe.transform("CREATED THIS ROOM"), null, admin, time, null, null, null, null, displaytime, null);
              }
              if (roomlist.length == 0) {
                roomlist.push(new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, ""));
              } else {
                let index = 0;
                let added = false;
                for (let r of roomlist) {
                  if (Number(r.newestMessage.time.substring(0, 8) + r.newestMessage.time.substring(9, 15)) < Number(time.substring(0, 8) + time.substring(9, 15))) {
                    let newRoom = new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, "");
                    roomlist.splice(index, 0, newRoom);
                    added = true;
                    break;
                  } else {
                    index++;
                  }
                }
                if (added == false) {
                  roomlist.push(new Room(snapshot.key, name, caty, time, passwd, adminname, desc, m, ""));
                }
              }
            }
          })
        })

        let storage_images = mca_firebase.storage().ref('/room_images').child(room_image);
        storage_images.getDownloadURL().then(function(url_image) {
          roomlist.find(x => x.key == snapshot.key).img = url_image;
        })
      })
    })
    this.items.next(roomlist);
    this.items_messages.next(messagelist);
  }

  public openRoom(roomkey: string): void {
    this.cancelQuote();
    if (this.roomkey != "") {
      let oldmessageRef = mca_firebase.database().ref('/rooms').child(this.roomkey);
      oldmessageRef.off("child_added");

      let currentRoomkey = this.roomkey;
      let newestMessageRef = oldmessageRef.orderByKey().limitToLast(1);

      let translatepipe = this.translatepipe;

      newestMessageRef.on("child_added", function(nmSnapshot, prevChildKey) {
        roomlist.forEach(room => {
          if (room.key == currentRoomkey) {
            if (nmSnapshot.key != "-0roomdata") {
              let newestMessageData = nmSnapshot.val();
              let img = newestMessageData.img;
              let msg = newestMessageData.msg;
              let messageuserid = newestMessageData.name;
              let username = userlist.find(x => x.key == messageuserid).name;
              let pin = newestMessageData.pin;
              let quote = newestMessageData.quote;
              let newesttime = newestMessageData.time;
              let newestdisplaytime;
              let now = new Date();
              let year = String(now.getUTCFullYear());
              let month = (now.getUTCMonth()+1 < 10) ? "0" + String(now.getUTCMonth()+1) : String(now.getUTCMonth()+1);
              let day = (now.getUTCDate() < 10) ? "0" + String(now.getUTCDate()) : String(now.getUTCDate());
              let hours = (now.getUTCHours() < 10) ? "0" + String(now.getUTCHours()) : String(now.getUTCHours());
              let minutes = (now.getUTCMinutes() < 10) ? "0" + String(now.getUTCMinutes()) : String(now.getUTCMinutes());
              let seconds = (now.getUTCSeconds() < 10) ? "0" + String(now.getUTCSeconds()) : String(now.getUTCSeconds());
              let utc_timestamp = year + month + day + "_" + hours + minutes + seconds + "_UTC";
              let date = new Date(newesttime.substring(0, 4) + '-' + newesttime.substring(4, 6) + '-' +  newesttime.substring(6, 8) + 'T' +  newesttime.substring(9, 11) + ':' + newesttime.substring(11, 13) + ':' + newesttime.substring(13, 15) + '.000Z')
              let display_year = String(date.getFullYear());
              let display_month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
              let display_day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
              let display_hour = (date.getHours() < 10) ? "0" + String(date.getHours()) : String(date.getHours());
              let display_minutes = (date.getMinutes() < 10) ? "0" + String(date.getMinutes()) : String(date.getMinutes());
              if (display_year + display_month + display_day == utc_timestamp.substring(0,8)) {
                newestdisplaytime = display_hour + ":" + display_minutes;
              } else {
                newestdisplaytime = display_day + "." + display_month + "." + display_year;
              }
              let m;
              if (img != "") {
                if (messageuserid == userid) {
                  m = new Message(nmSnapshot.key, translatepipe.transform("YOU SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                } else {
                  m = new Message(nmSnapshot.key, username + " " + translatepipe.transform("SHARED A PICTURE"), img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                }
              } else {
                if (messageuserid == userid) {
                  m = new Message(nmSnapshot.key, translatepipe.transform("YOU") + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                } else {
                  m = new Message(nmSnapshot.key, username + ": " + msg, img, username, newesttime, quote, pin, messageuserid, null, newestdisplaytime, null);
                }
              }
              let oldmessage = roomlist.find(x => x.key == currentRoomkey).newestMessage;
              roomlist.find(x => x.key == currentRoomkey).newestMessage = m;
              if (oldmessage.key != m.key) {
                let index = roomlist.indexOf(roomlist.find(x => x.key == currentRoomkey));
                let element = roomlist[index];
                roomlist.splice(index, 1);
                roomlist.splice(0, 0, element);
              }
            }
          }
        });
      })
    }

    let old_time;
    for (let r of roomlist) {
      if (r.key == roomkey) {
        old_time = r.time;
        let date = new Date(r.time.substring(0, 4) + '-' + r.time.substring(4, 6) + '-' +  r.time.substring(6, 8) + 'T' +  r.time.substring(9, 11) + ':' + r.time.substring(11, 13) + ':' + r.time.substring(13, 15) + '.000Z')
        let year = String(date.getFullYear());
        let month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
        let day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
        let displaytime = day + "." + month + "." + year
        if (navigator.language.substring(0, 2) == "de") {
          document.getElementById('headeritem').innerHTML = "Raum wurde am " + displaytime + " von " + r.admin + " erstellt";
        } else {
          document.getElementById('headeritem').innerHTML = "Room was created on " + displaytime + " by " + r.admin;
        }
      }
    }

    document.getElementById('headeritem').style.display = "block";
    document.getElementById('inputbox').style.display = "";
    document.getElementById('noroom').style.display = "none";
    this.roomkey = roomkey;
    this.messageRef = mca_firebase.database().ref('/rooms').child(roomkey);
    messagelist = [];
    let translatepipe = this.translatepipe;
    this.messageRef.on("child_added", function(snapshot, prevChildKey) {
      if (snapshot.key != "-0roomdata") {
        let messageData = snapshot.val();
        let img = messageData.img;
        let msg = messageData.msg;
        let userid = messageData.name;
        let name = userlist.find(x => x.key == userid).name;
        let pin = messageData.pin;
        let quote = messageData.quote;
        let time = messageData.time;

        let old_date = new Date(old_time.substring(0, 4) + '-' + old_time.substring(4, 6) + '-' +  old_time.substring(6, 8) + 'T' +  old_time.substring(9, 11) + ':' + old_time.substring(11, 13) + ':' + old_time.substring(13, 15) + '.000Z')
        let date = new Date(time.substring(0, 4) + '-' + time.substring(4, 6) + '-' +  time.substring(6, 8) + 'T' +  time.substring(9, 11) + ':' + time.substring(11, 13) + ':' + time.substring(13, 15) + '.000Z')
        let year = String(date.getFullYear());
        let month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
        let day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
        let old_year = String(old_date.getFullYear());
        let old_month = (old_date.getMonth()+1 < 10) ? "0" + String(old_date.getMonth()+1) : String(old_date.getMonth()+1);
        let old_day = (old_date.getDate() < 10) ? "0" + String(old_date.getDate()) : String(old_date.getDate());

        if (year + month + day != old_year + old_month + old_day) {
          let displaytime = day + "." + month + "." + year;
          let m = new Message("time", displaytime, "", name, time, quote, pin, userid, null, null, null);
          messagelist.push(m);
        }

        let displaytime = (date.getHours() < 10 ? "0" + String(date.getHours()) : String(date.getHours())) + ":" + (date.getMinutes() < 10 ? "0" + String(date.getMinutes()) : String(date.getMinutes()))

        let pb_url = userlist.find(x => x.key == userid).profile_image;
        let m;
        if (quote != "") {
          for (let message of messagelist) {
            if (message.key == quote) {
              m = new Message(snapshot.key, msg, "", name, time, quote, pin, userid, pb_url, displaytime, message);
            }
          }
        } else {
          m = new Message(snapshot.key, msg, "", name, time, quote, pin, userid, pb_url, displaytime, null);
        }
        messagelist.push(m);
        let tmpmessagelist = messagelist;
        messagelist = [];
        messagelist = tmpmessagelist;

        old_time = time;

        if (img != "") {
          let storage_img = mca_firebase.storage().ref('/images').child(img);
          storage_img.getDownloadURL().then(function(url_img) {
            messagelist.find(x => x.key == snapshot.key).img = url_img;
          })
        }
        setTimeout(function() { 
          let messagebox = document.getElementById("messages");
          messagebox.scrollTop = messagebox.scrollHeight;
          if (img == "") {
            document.getElementById('messagecontent_' + snapshot.key).innerHTML = document.getElementById('messagecontent_' + snapshot.key).innerHTML.replace(
              /((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g,
              '<a href="$1" target="_blank" title="' + translatepipe.transform('OPEN LINK') + '" style="color: white">$1</a>'
            );
          }
        }, 10);
      }
    })
    this.items_messages.next(messagelist);
    document.getElementById("messageinput").focus();
  }

  public sendMessage(message: String): void {
    message = message.trim();
    if (message != "" && this.roomkey != "") {
      let newMessage = new Message(null, message, "", userid, this.getCurrentTime(), this.quote, "0", null, null, null, null);
      let messageRef = mca_firebase.database().ref('/rooms/' + this.roomkey);
      messageRef.push(newMessage);
      this.quote = "";
      document.getElementById("quotebox").style.display = "none";
      document.getElementById("chatbox").style.maxHeight = "calc(100vh - 95px)"
    }
  }

  public getCurrentTime(): String {
    let now = new Date();
    let year = String(now.getUTCFullYear());
    let month = (now.getUTCMonth()+1 < 10) ? "0" + String(now.getUTCMonth()+1) : String(now.getUTCMonth()+1);
    let day = (now.getUTCDate() < 10) ? "0" + String(now.getUTCDate()) : String(now.getUTCDate());
    let hours = (now.getUTCHours() < 10) ? "0" + String(now.getUTCHours()) : String(now.getUTCHours());
    let minutes = (now.getUTCMinutes() < 10) ? "0" + String(now.getUTCMinutes()) : String(now.getUTCMinutes());
    let seconds = (now.getUTCSeconds() < 10) ? "0" + String(now.getUTCSeconds()) : String(now.getUTCSeconds());
    let utc_timestamp = year + month + day + "_" + hours + minutes + seconds + "_UTC";
    return utc_timestamp;
  }

  public logout() {
    userid = null;
    this.userid = null;
    this.roomkey = null;
    messagelist = [];
    this.quote = "";
    this.room_image = "";
    this.profile_banner = "";
    this.profile_image = "";
    mca_firebase.auth().signOut();
    this.router.navigate(['login']);
  }

  public showProfile(type: number) {
    if (type == 0) {
      document.getElementById('edit_profile_button').style.display = "block";
      this.displayUser = this.currentUser;
      let modal = document.getElementById("myModal");
      modal.style.display = "block";
    } else {
      let userkey = messagelist.find(x => x.key == this.cm_message).userid;
      if (userkey == userid) {
        document.getElementById('edit_profile_button').style.display = "block";
      } else {
        document.getElementById('edit_profile_button').style.display = "none";
      }
      this.displayUser = userlist.find(x => x.key == userkey);
      let modal = document.getElementById("myModal");
      modal.style.display = "block";
    }
  }

  public closeProfile() {
    let modal = document.getElementById("myModal");
    modal.style.display = "none";
  }

  public showSettings() {
    if (this.theme == "dark") {
      this.changethemeevent.setValue(true)
    }
    let modal = document.getElementById("settingsModal");
    modal.style.display = "block";
  }

  public closeSettings() {
    let modal = document.getElementById("settingsModal");
    modal.style.display = "none";
  }

  public changeTheme() {
    if (this.changethemeevent.value == true) {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.theme = document.documentElement.getAttribute('data-theme');
      this.setCookie("theme", "dark", 30)
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      this.theme = document.documentElement.getAttribute('data-theme');
      this.setCookie("theme", "light", 30)
    }
  }

  public openFullscreen(imagesrc: string) {
    let fullscreenimage = document.getElementById("fullscreenimage") as HTMLImageElement;
    fullscreenimage.src = imagesrc;

    document.getElementById("image-modal-content").style.width = "auto";
    document.getElementById("image-modal-content").style.height = "auto";

    fullscreenimage.onload = function() {
      if (fullscreenimage.width/window.innerWidth > fullscreenimage.height/window.innerHeight) {
        let imagewidth = fullscreenimage.width;
        let imageheight = fullscreenimage.height;
        document.getElementById("image-modal-content").style.width = "90%";
        document.getElementById("image-modal-content").style.height = "calc(90vw * (" + imageheight + " / " + imagewidth + ") + 35px)";
      } else {
        let imagewidth = fullscreenimage.width;
        let imageheight = fullscreenimage.height;
        document.getElementById("image-modal-content").style.height = "90%";
        document.getElementById("image-modal-content").style.width = "calc(90vh * (" + imagewidth + " / " + imageheight + ") - 35px)";
      }
    }

    let modal = document.getElementById("imageModal");
    modal.style.display = "block";
  }

  public closeFullscreen() {
    let modal = document.getElementById("imageModal");
    modal.style.display = "none";
  }

  public addRoom() {
    this.room_image = "";
    let modal = document.getElementById("roomModal");
    modal.style.display = "block";
  }

  public cancelAddingRoom() {
    let modal = document.getElementById("roomModal");
    modal.style.display = "none";
  }

  public createRoom(name: HTMLInputElement, desc: HTMLTextAreaElement, cat: HTMLInputElement, passwd: HTMLInputElement, passwdr: HTMLInputElement) {
    if (name.value.trim() != '' && desc.value.trim() != '' && cat.value != '0' && passwd.value.trim() != '' && passwd.value.trim() == passwdr.value.trim()) {
      let randomNumber = Math.floor(Math.random() * 4) + 1;
      let r;
      if (this.room_image == "") {
        r = new Room(null, name.value.trim(), cat.value, this.getCurrentTime(), passwd.value.trim(), userid, desc.value.trim(), null, "standard" + randomNumber);
      } else {
        r = new Room(null, name.value.trim(), cat.value, this.getCurrentTime(), passwd.value.trim(), userid, desc.value.trim(), null, this.room_image);
      }
      let roomRef = mca_firebase.database().ref('/rooms/');
      roomRef.push().child('-0roomdata').set(r);
      let modal = document.getElementById("roomModal");
      modal.style.display = "none";
      name.value = '';
      desc.value = '';
      passwd.value = '';
      passwdr.value = '';
      cat.value = '0';
      this.room_image = '';
    }
  }

  public onFileUpload(event, type: number) {
    const uuidv1 = require('uuid/v1');
    let uuid = uuidv1();

    if (type == 0) {
      if (this.roomkey != "") {
        let time = this.getCurrentTime();
        let rk = this.roomkey;
        
        let file = event.target.files[0];
        let storageRef = mca_firebase.storage().ref();
        let quoteid = this.quote;
        this.quote = "";
        document.getElementById("quotebox").style.display = "none";
        document.getElementById("chatbox").style.maxHeight = "calc(100vh - 95px)"
  
        storageRef.child('images/tmp-'+uuid).put(file).then(function(snapshot) {
          console.log("upload successful");
          let newMessage = new Message(null, "", uuid, userid, time, quoteid, "0", null, null, null, null);
          let messageRef = mca_firebase.database().ref('/rooms/' + rk);
          messageRef.push(newMessage);
        }, function(error) {
          console.log("upload failed");
        })
      }
    } else if (type == 1) {
      let file = event.target.files[0];
      let storageRef = mca_firebase.storage().ref();

      this.room_image = uuid;

      storageRef.child('room_images/tmp-'+uuid).put(file).then(function(snapshot) {
        console.log("upload successful");
      }, function(error) {
        console.log("upload failed");
      })
    } else if (type == 2) {
      let file = event.target.files[0];
      let storageRef = mca_firebase.storage().ref();

      this.profile_image = uuid;

      storageRef.child('profile_images/tmp-'+uuid).put(file).then(function(snapshot) {
        console.log("upload successful");
      }, function(error) {
        console.log("upload failed");
      })
    } else if (type == 3) {
      let file = event.target.files[0];
      let storageRef = mca_firebase.storage().ref();

      this.profile_banner = uuid;

      storageRef.child('profile_banners/tmp-'+uuid).put(file).then(function(snapshot) {
        console.log("upload successful");
      }, function(error) {
        console.log("upload failed");
      })
    }
  }

  private setCookie(name: string, value: string, expireDays: number, path: string = '') {
    let d:Date = new Date();
    d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
    let expires:string = `expires=${d.toUTCString()}`;
    let cpath:string = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}`;
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

  public openMessageMenu({ x, y }: MouseEvent, messageid: string) {
    this.cm_message = messageid;
    let modalcontent = document.getElementById("contextmenu");
    let m = messagelist.find(x => x.key == messageid);
    if (m.img == "") {
      document.getElementById('cmdownloadbutton').style.display = "none";
    } else {
      document.getElementById('cmdownloadbutton').style.display = "";
    }
    if (m.pin == "0") {
      document.getElementById('pin_button_text').innerHTML = this.translatepipe.transform("PIN");
      let pin_icon = document.getElementById('pin_icon') as HTMLImageElement;
      if (this.theme == 'dark') {
        pin_icon.src = "assets/img/ic_pin_dark.png";
      } else {
        pin_icon.src = "assets/img/ic_pin.png";
      }
    } else {
      document.getElementById('pin_button_text').innerHTML = this.translatepipe.transform("UNPIN");
      let pin_icon = document.getElementById('pin_icon') as HTMLImageElement;
      if (this.theme == 'dark') {
        pin_icon.src = "assets/img/ic_unpin_dark.png";
      } else {
        pin_icon.src = "assets/img/ic_unpin.png";
      }
    }
    if (y < 200) {
      modalcontent.style.top = "200px";
    } else {
      modalcontent.style.top = y + "px";
    }
    modalcontent.style.left = x + "px";
    modalcontent.style.display = "block";
    return false;
  }

  public quoteMessage() {
    this.quote = this.cm_message;
    document.getElementById("quotebox").style.display = "flex";
    document.getElementById("chatbox").style.maxHeight = "calc(100vh - 130px)"
    if (messagelist.find(x => x.key == this.quote).userid == this.userid) {
      document.getElementById("quotetext").innerHTML = this.translatepipe.transform("YOU") + ": " + messagelist.find(x => x.key == this.quote).msg.toString();
    } else {
      document.getElementById("quotetext").innerHTML = messagelist.find(x => x.key == this.quote).name.toString() + ": " + messagelist.find(x => x.key == this.quote).msg.toString();
    }
    if(messagelist.find(x => x.key == this.quote).img != "") {
      document.getElementById('quoteimage').style.display = "block";
      (document.getElementById('quoteimage') as HTMLImageElement).src = String(messagelist.find(x => x.key == this.quote).img);
    } else {
      document.getElementById('quoteimage').style.display = "none";
    }
    document.getElementById("messageinput").focus();
  }

  public cancelQuote() {
    this.quote = "";
    document.getElementById("quotebox").style.display = "none";
    document.getElementById("chatbox").style.maxHeight = "calc(100vh - 95px)"
  }

  public forwardMessage() {
    if (roomlist.length > 1) {
      let modal = document.getElementById("forwardModal");
      modal.style.display = "block";
    }
  }

  public cancelForwarding() {
    let modal = document.getElementById("forwardModal");
    modal.style.display = "none";
  }

  public forwardTo(roomkey: String) {
    let modal = document.getElementById("forwardModal");
    modal.style.display = "none";
    let message = messagelist.find(x => x.key == this.cm_message);
    let m = new Message(null, "(Forwarded) " + message.msg, "", userid, this.getCurrentTime(), "", "0", null, null, null, null);
    let messageRef = mca_firebase.database().ref('/rooms/' + roomkey);
    messageRef.push(m);

    this.showToast(this.translatepipe.transform("MESSAGE FORWARDED"));
  }

  public jumpToQuotedMessage(messageid: string) {
    let quoteid = messagelist.find(x => x.key == messageid).quote;
    if (quoteid != "") {
      let targetMessage = document.getElementById('message_' + quoteid)
      document.getElementById('messages').scrollTop = (targetMessage.offsetTop - 55);
      targetMessage.style.background = "grey";
      setTimeout(function() {
        targetMessage.style.background = null;
      }, 1000);
    }
  }

  public pinMessage() {
    let m = messagelist.find(x => x.key == this.cm_message)
    if (m.pin == "0") {
      m.pin = "1"
      mca_firebase.database().ref('/rooms/' + this.roomkey + '/' + this.cm_message + '/pin').set("1");
      this.showToast(this.translatepipe.transform("MESSAGE PINNED"));
    } else {
      m.pin = "0"
      mca_firebase.database().ref('/rooms/' + this.roomkey + '/' + this.cm_message + '/pin').set("0");
      this.showToast(this.translatepipe.transform("MESSAGE UNPINNED"));
    }
  }

  public openEditProfile() {
    (document.getElementById('edit_profile_name') as HTMLInputElement).value = String(this.currentUser.name);
    (document.getElementById('edit_profile_bio') as HTMLInputElement).value = String(this.currentUser.bio);
    (document.getElementById('edit_profile_birthday') as HTMLInputElement).value = String(this.currentUser.bday).substring(6, 10) + "-" + String(this.currentUser.bday).substring(3, 5) + "-" + String(this.currentUser.bday).substring(0, 2);
    (document.getElementById('edit_profile_location') as HTMLInputElement).value = String(this.currentUser.loc);
    (document.getElementById('profile_image_input') as HTMLInputElement).src = String(this.currentUser.profile_image);
    (document.getElementById('profile_banner_input') as HTMLInputElement).src = String(this.currentUser.profile_banner);
    document.getElementById('editProfileModal').style.display = "block";
  }

  public cancelEditProfile() {
    document.getElementById('editProfileModal').style.display = "none";
    this.profile_banner = "";
    this.profile_image = "";
  }

  public editProfile(name: string, bio: string, birthday: string, location: string) {
    if (name.trim() != '' && bio.trim() != '' && birthday != '0' && location.trim()) {
      mca_firebase.database().ref('/users/' + userid + '/name').set(name);
      mca_firebase.database().ref('/users/' + userid + '/bio').set(bio);
      mca_firebase.database().ref('/users/' + userid + '/bday').set(birthday.replace(/-/g, ""));
      mca_firebase.database().ref('/users/' + userid + '/loc').set(location);
      if (this.profile_image != "") {
        mca_firebase.database().ref('/users/' + userid + '/img').set(this.profile_image);
        mca_firebase.database().ref('/users/' + userid + '/ownpi').set("1");
      }
      if (this.profile_banner != "") {
        mca_firebase.database().ref('/users/' + userid + '/banner').set(this.profile_banner);
      }
      document.getElementById('editProfileModal').style.display = "none";
      this.currentUser.name = name;
      this.currentUser.bio = bio;
      this.currentUser.bday = birthday.substring(8, 10) + "." + birthday.substring(5, 7) + "." + birthday.substring(0, 4);
      this.currentUser.loc = location;

      this.profile_banner = "";
      this.profile_image = "";

      //this.showToast(this.translatepipe.transform("PROFILE EDITED"));
    }
  }

  public showToast(message: string) {
    document.getElementById('toast').style.display = "block";
    document.getElementById('toasttext').innerHTML = message;
    setTimeout(function() {
      document.getElementById('toast').style.display = "none";
    }, 2000);
  }

  public searchRoom(input: string) {
    if (input != "") {
      let searchroomlist: Array<Room> = [];
      for (let room of roomlist) {
        if (room.name.toLowerCase().includes(input.toLowerCase())) {
          searchroomlist.push(room);
        }
      }
      this.items.next(searchroomlist);
    } else {
      this.items.next(roomlist);
    }
  }

  public async downloadFile() {
    let m = messagelist.find(x => x.key == this.cm_message)
    var a = document.createElement("a");
    a.href = await this.toDataURL(m.img);
    let currentdate = this.getCurrentTime();
    a.download = "MyChatApp_" + currentdate.substring(0, 15);
    a.click();
  }

  toDataURL(url) {
    return fetch(url).then((response) => {
        return response.blob();
    }).then(blob => {
        return URL.createObjectURL(blob);
    });
  }

  public deleteSearchInput() {
    (document.getElementById('roomsearchinput') as HTMLInputElement).value = "";
    this.searchRoom("");
  }
}