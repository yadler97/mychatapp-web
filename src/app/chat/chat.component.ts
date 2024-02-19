import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, pipe } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { appname } from '../../environments/appname';
import { TranslateService } from '../translate.service';
import { TranslatePipe } from '../translate.pipe';

import { environment } from '../../environments/environment';

import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/storage";

import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';

class Room {
  constructor(public key: String, public name: String, public category: number, public time: String, public password: String, public admin: String, public description: String, public newestMessage: Message, public image: String) { }
}

class Message {
  constructor(public key: String, public text: String, public image: String, public sender: String, public time: String, public quote: String, public pinned: boolean, public userid: String, public pb_url: String, public displayTime: String, public quotedMessage: Message, public forwarded: boolean) {}
}

class User {
  constructor(public key: String, public name: String, public description: String, public birthday: String, public location: String, public favColour: number, public ownProfileImage: boolean, public profile_image: String, public profile_banner: String) {}
}

const app = firebase.initializeApp(environment.firebase);
const database = firebase.database(app);
const auth = firebase.auth(app);
const storage = firebase.storage(app);

let roomlist: Array<Room> = [];
let messagelist: Array<Message> = [];
let roommemberlist: Array<User> = [];
let userlist: Array<User> = [];
let userid: string;

@Component({
  selector: 'app-mychatapp',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  providers: [TranslatePipe]
})

export class ChatComponent implements OnInit {

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
    auth.onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified) {
          userid = user.uid;
          this.userid = user.uid;
        } else {
          auth.signOut;
          this.router.navigate(['login']);
        }
      } else {
        this.router.navigate(['login']);
      }
    });
  }

  roomkey: string = "";
  room: Room;
  selectedCategory: string;
  messageRef = database.ref('/rooms');

  ngOnDestroy() {
    let roomRef = database.ref('/rooms');
    roomRef.off("child_added");
  }

  items: BehaviorSubject<Room[]> = new BehaviorSubject<Room[]>([]);
  items_messages: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>([]);
  items_pinned: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>([]);
  items_members: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);

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
      let modal = document.getElementById("profileModal");
      if (event.target == modal) {
        modal!.style.display = "none";
      }

      let roommodal = document.getElementById("roomModal");
      if (event.target == roommodal) {
        roommodal!.style.display = "none";
      }

      let imagemodal = document.getElementById("imageModal");
      if (event.target == imagemodal) {
        imagemodal!.style.display = "none";
      }

      let settingsmodal = document.getElementById("settingsModal");
      if (event.target == settingsmodal) {
        settingsmodal!.style.display = "none";
      }

      let forwardmodal = document.getElementById("forwardModal");
      if (event.target == forwardmodal) {
        forwardmodal!.style.display = "none";
      }

      let editprofilemodal = document.getElementById("editProfileModal");
      if (event.target == editprofilemodal) {
        editprofilemodal!.style.display = "none";
      }

      let roomInfoModal = document.getElementById("roomInfoModal");
      if (event.target == roomInfoModal) {
        roomInfoModal!.style.display = "none";
      }

      let pinboardModal = document.getElementById("pinboardModal");
      if (event.target == pinboardModal) {
        pinboardModal!.style.display = "none";
      }

      let contextmenu = document.getElementById("contextmenu");
      contextmenu!.style.display = "none";
    }

    let userRef = database.ref('/users');
    userlist = [];
    userRef.on("child_added", (snapshot) => {
      let userData = snapshot.val();
      let name = userData.name;
      let description = userData.description;
      let birthday = userData.birthday;
      birthday = birthday.substring(6, 8) + "." + birthday.substring(4, 6) + "." + birthday.substring(0, 4);
      let location = userData.location;
      let favColour = userData.favColour;
      let ownProfileImage = userData.ownProifleImage;
      let image = userData.image;
      let banner = userData.banner;

      let u = new User(snapshot.key!, name, description, birthday, location, favColour, ownProfileImage, "", "");
      userlist.push(u);
      if (u.key == userid) {
        this.currentUser = u;
      }

      let storage_images = storage.ref('/profile_images/' + image);
      storage_images.getDownloadURL().then(url_image => {
        userlist.find(x => x.key == snapshot.key)!.profile_image = url_image;
        if (snapshot.key == userid) {
          this.currentUser.profile_image = url_image;
        }
        if (banner != "") {
          let storage_banners = storage.ref('/profile_banners/' + banner);
          storage_banners.getDownloadURL().then(url_banner => {
            userlist.find(x => x.key == snapshot.key)!.profile_banner = url_banner;
            if (snapshot.key == userid) {
              this.currentUser.profile_banner = url_banner;
            }
          }).catch(error => {
            switch (error.code) {
              case 'storage/object-not-found':
                break;
            }
          })
        }
      })
    })

    let roomRef = database.ref('/rooms');
    roomlist = [];
    roomRef.on("child_added", function(snapshot, prevChildKey) {
      let roomdataref = roomRef.child(snapshot.key! + "/roomData");
      roomdataref.once("value").then(function(roomdataSnapshot) {
        let roomData = roomdataSnapshot.val();
        let name = roomData.name;
        let admin = roomData.admin;
        let category = roomData.category;
        let time = roomData.time;
        let password = roomData.password;
        let description = roomData.description;
        let room_image = roomData.image;
        let now = new Date();
        let year = String(now.getUTCFullYear());
        let month = (now.getUTCMonth()+1 < 10) ? "0" + String(now.getUTCMonth()+1) : String(now.getUTCMonth()+1);
        let day = (now.getUTCDate() < 10) ? "0" + String(now.getUTCDate()) : String(now.getUTCDate());
        let hours = (now.getUTCHours() < 10) ? "0" + String(now.getUTCHours()) : String(now.getUTCHours());
        let minutes = (now.getUTCMinutes() < 10) ? "0" + String(now.getUTCMinutes()) : String(now.getUTCMinutes());
        let seconds = (now.getUTCSeconds() < 10) ? "0" + String(now.getUTCSeconds()) : String(now.getUTCSeconds());
        let utc_timestamp = year + month + day + "_" + hours + minutes + seconds + "_UTC";

        let displaytime: String;
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

        let newestMessageRef = roomRef.child(snapshot.key!).child("messages").orderByKey().limitToLast(1);

        newestMessageRef.on("child_added", function(nmSnapshot, prevChildKey) {
          let newestMessageData = nmSnapshot.val();
          let image = newestMessageData.image;
          let text = newestMessageData.text;
          let messageuserid = newestMessageData.sender;
          let username = userlist.find(x => x.key == messageuserid)!.name;
          let pinned = newestMessageData.pinned;
          let forwarded = newestMessageData.forwarded;
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
          if (image != "") {
            if (messageuserid == userid) {
              m = new Message(nmSnapshot.key!, translatepipe.transform("YOU SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
            } else {
              m = new Message(nmSnapshot.key!, username + " " + translatepipe.transform("SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
            }
          } else {
            if (messageuserid == userid) {
              m = new Message(nmSnapshot.key!, translatepipe.transform("YOU") + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
            } else {
              m = new Message(nmSnapshot.key!, username + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
            }
          }
          let oldmessage = roomlist.find(x => x.key == snapshot.key)!?.newestMessage;
          roomlist.find(x => x.key == snapshot.key)!.newestMessage = m;
          if (oldmessage.key != m.key) {
            let index = roomlist.indexOf(roomlist.find(x => x.key == snapshot.key)!);
            let element = roomlist[index];
            roomlist.splice(index, 1);
            roomlist.splice(0, 0, element);
          }
        })

        newestMessageRef.once("value").then(function(newestMessageSnapshot) {
          newestMessageSnapshot.forEach(function(childSnapshot) {
            if (childSnapshot.key != "roomData") {
              let newestMessageData = childSnapshot.val();
              let image = newestMessageData.image;
              let text = newestMessageData.text;
              let messageuserid = newestMessageData.sender;
              let username = userlist.find(x => x.key == messageuserid)!.name;
              let pinned = newestMessageData.pinned;
              let forwarded = newestMessageData.forwarded;
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
              if (image != "") {
                if (messageuserid == userid) {
                  m = new Message(childSnapshot.key, translatepipe.transform("YOU SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
                } else {
                  m = new Message(childSnapshot.key, username + " " + translatepipe.transform("SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
                }
              } else {
                if (messageuserid == userid) {
                  m = new Message(childSnapshot.key, translatepipe.transform("YOU") + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
                } else {
                  m = new Message(childSnapshot.key, username + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
                }
              }
              if (roomlist.length == 0) {
                roomlist.push(new Room(snapshot.key!, name, category, time, password, admin, description, m, ""));
              } else {
                let index = 0;
                let added = false;
                for (let r of roomlist) {
                  if (Number(r.newestMessage.time.substring(0, 8) + r.newestMessage.time.substring(9, 15)) < Number(m.time.substring(0, 8) + m.time.substring(9, 15))) {
                    let newRoom = new Room(snapshot.key!, name, category, time, password, admin, description, m, "");
                    roomlist.splice(index, 0, newRoom);
                    added = true;
                    break;
                  } else {
                    index++;
                  }
                }
                if (added == false) {
                  roomlist.push(new Room(snapshot.key!, name, category, time, password, admin, description, m, ""));
                }
              }
            } else {
              let adminname = userlist.find(x => x.key == admin)!.name;
              let m;
              if (admin == userid) {
                m = new Message(childSnapshot.key, translatepipe.transform("YOU CREATED THIS ROOM"), null, admin, time, null, null, null, null, displaytime, null, false);
              } else {
                m = new Message(childSnapshot.key, adminname + " " + translatepipe.transform("CREATED THIS ROOM"), null, admin, time, null, null, null, null, displaytime, null, false);
              }
              if (roomlist.length == 0) {
                roomlist.push(new Room(snapshot.key!, name, category, time, password, admin, description, m, ""));
              } else {
                let index = 0;
                let added = false;
                for (let r of roomlist) {
                  if (Number(r.newestMessage.time.substring(0, 8) + r.newestMessage.time.substring(9, 15)) < Number(time.substring(0, 8) + time.substring(9, 15))) {
                    let newRoom = new Room(snapshot.key!, name, category, time, password, admin, description, m, "");
                    roomlist.splice(index, 0, newRoom);
                    added = true;
                    break;
                  } else {
                    index++;
                  }
                }
                if (added == false) {
                  roomlist.push(new Room(snapshot.key!, name, category, time, password, admin, description, m, ""));
                }
              }
            }
          })
        })

        let storage_images = storage.ref('/room_images/' + room_image);
        storage_images.getDownloadURL().then(function(url_image) {
          roomlist.find(x => x.key == snapshot.key)!.image = url_image;
        })
      })
    })
    this.items.next(roomlist);
    this.items_messages.next(messagelist);
  }

  public formatDate(timestamp: String): string {
    let now = new Date();
    let year = String(now.getUTCFullYear());
    let month = (now.getUTCMonth()+1 < 10) ? "0" + String(now.getUTCMonth()+1) : String(now.getUTCMonth()+1);
    let day = (now.getUTCDate() < 10) ? "0" + String(now.getUTCDate()) : String(now.getUTCDate());
    let hours = (now.getUTCHours() < 10) ? "0" + String(now.getUTCHours()) : String(now.getUTCHours());
    let minutes = (now.getUTCMinutes() < 10) ? "0" + String(now.getUTCMinutes()) : String(now.getUTCMinutes());
    let seconds = (now.getUTCSeconds() < 10) ? "0" + String(now.getUTCSeconds()) : String(now.getUTCSeconds());
    let utc_timestamp = year + month + day + "_" + hours + minutes + seconds + "_UTC";
    let date = new Date(timestamp.substring(0, 4) + '-' + timestamp.substring(4, 6) + '-' +  timestamp.substring(6, 8) + 'T' +  timestamp.substring(9, 11) + ':' + timestamp.substring(11, 13) + ':' + timestamp.substring(13, 15) + '.000Z')
    let display_year = String(date.getFullYear());
    let display_month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
    let display_day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
    let display_hour = (date.getHours() < 10) ? "0" + String(date.getHours()) : String(date.getHours());
    let display_minutes = (date.getMinutes() < 10) ? "0" + String(date.getMinutes()) : String(date.getMinutes());
    if (display_year + display_month + display_day == utc_timestamp.substring(0,8)) {
      return display_hour + ":" + display_minutes;
    } else {
      return display_day + "." + display_month + "." + display_year;
    }
  }

  public openRoom(roomkey: String): void {
    roommemberlist = [];
    this.cancelQuote();
    if (this.roomkey != "") {
      let oldmessageRef = database.ref('/rooms/' + this.roomkey + '/messages');
      oldmessageRef.off("child_added");

      let currentRoomkey = this.roomkey;
      let newestMessageRef = oldmessageRef.orderByKey().limitToLast(1);

      let translatepipe = this.translatepipe;
      let formatDate = this.formatDate;

      newestMessageRef.on("child_added", function(nmSnapshot, prevChildKey) {
        roomlist.forEach(room => {
          if (room.key == currentRoomkey) {
            let newestMessageData = nmSnapshot.val();
            let image = newestMessageData.image;
            let text = newestMessageData.text;
            let messageuserid = newestMessageData.sender;
            let username = userlist.find(x => x.key == messageuserid)!.name;
            let pinned = newestMessageData.pinned;
            let forwarded = newestMessageData.forwarded;
            let quote = newestMessageData.quote;
            let newesttime = newestMessageData.time;
            let newestdisplaytime = formatDate(newesttime);
            let m;
            if (image != "") {
              if (messageuserid == userid) {
                m = new Message(nmSnapshot.key!, translatepipe.transform("YOU SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
              } else {
                m = new Message(nmSnapshot.key!, username + " " + translatepipe.transform("SHARED A PICTURE"), image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
              }
            } else {
              if (messageuserid == userid) {
                m = new Message(nmSnapshot.key!, translatepipe.transform("YOU") + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
              } else {
                m = new Message(nmSnapshot.key!, username + ": " + text, image, username, newesttime, quote, pinned, messageuserid, null, newestdisplaytime, null, forwarded);
              }
            }
            let oldmessage = roomlist.find(x => x.key == currentRoomkey)!.newestMessage;
            roomlist.find(x => x.key == currentRoomkey)!.newestMessage = m;
            if (oldmessage.key != m.key) {
              let index = roomlist.indexOf(roomlist.find(x => x.key == currentRoomkey)!);
              let element = roomlist[index];
              roomlist.splice(index, 1);
              roomlist.splice(0, 0, element);
            }
          }
        });
      })
    }

    let old_time: String;
    for (let r of roomlist) {
      if (r.key == roomkey) {
        this.room = r;
        old_time = r.time;
        let date = new Date(r.time.substring(0, 4) + '-' + r.time.substring(4, 6) + '-' +  r.time.substring(6, 8) + 'T' +  r.time.substring(9, 11) + ':' + r.time.substring(11, 13) + ':' + r.time.substring(13, 15) + '.000Z')
        let year = String(date.getFullYear());
        let month = (date.getMonth()+1 < 10) ? "0" + String(date.getMonth()+1) : String(date.getMonth()+1);
        let day = (date.getDate() < 10) ? "0" + String(date.getDate()) : String(date.getDate());
        let displaytime = day + "." + month + "." + year
        let adminname = userlist.find(x => x.key == r.admin)!.name;
        if (navigator.language.substring(0, 2) == "de") {
          document.getElementById('headeritem')!.innerHTML = "Raum wurde am " + displaytime + " von " + adminname + " erstellt";
        } else {
          document.getElementById('headeritem')!.innerHTML = "Room was created on " + displaytime + " by " + adminname;
        }
        (document.getElementById('roomheaderimage') as HTMLInputElement).src = String(r.image);
        (document.getElementById('roomInfoImage') as HTMLInputElement).src = String(r.image);
        document.getElementById('roomInfoCreated')!.innerHTML = String(this.formatDate(r.time));
      }
    }

    document.getElementById('headeritem')!.style.display = "block";
    document.getElementById('inputbox')!.style.display = "";
    document.getElementById('roomheader')!.style.display = "";
    document.getElementById('noroom')!.style.display = "none";
    this.roomkey = roomkey.toString();
    this.messageRef = database.ref('/rooms/' + roomkey + '/messages');
    messagelist = [];
    let translatepipe = this.translatepipe;
    let messageCount = 0;
    this.messageRef.on("child_added", function(snapshot, prevChildKey) {
      messageCount++;
      document.getElementById('roomInfoPostedMessages')!.innerHTML = String(messageCount);
      let messageData = snapshot.val();
      let image = messageData.image;
      let text = messageData.text;
      let userid = messageData.sender;
      let name = userlist.find(x => x.key == userid)!.name;
      let pinned = messageData.pinned;
      let forwarded = messageData.forwarded;
      let quote = messageData.quote;
      let time = messageData.time;

      if (!roommemberlist.includes(userlist.find(x => x.key == userid))) {
        roommemberlist.push(userlist.find(x => x.key == userid));
      }

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
        let m = new Message("time", displaytime, "", name, time, quote, pinned, userid, null, null, null, false);
        messagelist.push(m);
      }

      let displaytime = (date.getHours() < 10 ? "0" + String(date.getHours()) : String(date.getHours())) + ":" + (date.getMinutes() < 10 ? "0" + String(date.getMinutes()) : String(date.getMinutes()))

      let pb_url = userlist.find(x => x.key == userid)!.profile_image;
      let m;
      if (quote != "") {
        let found = false;
        for (let message of messagelist) {
          if (message.key == quote) {
            m = new Message(snapshot.key!, text, "", name, time, quote, pinned, userid, pb_url, displaytime, message, forwarded);
            found = true;
          }
        }
        if (!found) {
          m = new Message(snapshot.key!, text, "", name, time, quote, pinned, userid, pb_url, displaytime, null, forwarded);
        }
      } else {
        m = new Message(snapshot.key!, text, "", name, time, quote, pinned, userid, pb_url, displaytime, null, forwarded);
      }
      messagelist.push(m!);
      let tmpmessagelist = messagelist;
      messagelist = [];
      messagelist = tmpmessagelist;

      old_time = time;

      if (image != "") {
        let storage_img = storage.ref('/images/' + image);
        storage_img.getDownloadURL().then(function(url_img) {
          messagelist.find(x => x.key == snapshot.key)!.image = url_img;
        })
      }
      setTimeout(function() { 
        let messagebox = document.getElementById("messages");
        messagebox!.scrollTop = messagebox!.scrollHeight;
        if (image == "") {
          document.getElementById('messagecontent_' + snapshot.key)!.innerHTML = document.getElementById('messagecontent_' + snapshot.key)!.innerHTML.replace(
            /((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g,
            '<a href="$1" target="_blank" title="' + translatepipe.transform('OPEN LINK') + '" style="color: white">$1</a>'
          );
        }
      }, 10);
    })
    this.items_messages.next(messagelist);
    this.items_members.next(roommemberlist);
    document.getElementById("messageinput")!.focus();
  }

  public sendMessage(message: string): void {
    message = message.trim();
    if (message != "" && this.roomkey != "") {
      let messageRef = database.ref('/rooms/' + this.roomkey + '/messages');
      let newMessageKey = messageRef.push().key;
      messageRef.child(newMessageKey).update({
        image: "",
        text: message,
        sender: userid,
        pinned: false,
        forwarded: false,
        quote: "",
        time: this.getCurrentTime()
      });
      this.quote = "";
      document.getElementById("quotebox")!.style.display = "none";
      document.getElementById("chatbox")!.style.maxHeight = "calc(100vh - 95px)"
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
    auth.signOut();
    this.router.navigate(['login']);
  }

  public showProfile(key: String) {
    if (key == userid) {
      document.getElementById('edit_profile_button')!.style.display = "block";
      this.displayUser = this.currentUser;
      document.getElementById('profileHeader')!.innerHTML = this.translatepipe.transform('MY PROFILE');
    } else if (key != null) {
      document.getElementById('edit_profile_button')!.style.display = "none";
      this.displayUser = userlist.find(x => x.key == key)!;
      document.getElementById('profileHeader')!.innerHTML = this.translatepipe.transform('PROFILE OF') + " " + this.displayUser.name;
    } else {
      document.getElementById('edit_profile_button')!.style.display = "none";
      let key = messagelist.find(x => x.key == this.cm_message)!.userid;
      this.displayUser = userlist.find(x => x.key == key)!;
      document.getElementById('profileHeader')!.innerHTML = this.translatepipe.transform('PROFILE OF') + " " + this.displayUser.name;
    }
    let modal = document.getElementById("profileModal");
    modal!.style.display = "block";
  }

  public closeProfile() {
    let modal = document.getElementById("profileModal");
    modal!.style.display = "none";
  }

  public showSettings() {
    if (this.theme == "dark") {
      this.changethemeevent.setValue(true)
    }
    let modal = document.getElementById("settingsModal");
    modal!.style.display = "block";
  }

  public closeSettings() {
    let modal = document.getElementById("settingsModal");
    modal!.style.display = "none";
  }

  public changeTheme() {
    if (this.changethemeevent.value == true) {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.theme = document.documentElement.getAttribute('data-theme')!;
      this.setCookie("theme", "dark", 30)
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      this.theme = document.documentElement.getAttribute('data-theme')!;
      this.setCookie("theme", "light", 30)
    }
  }

  public openFullscreen(imagesrc: string) {
    let fullscreenimage = document.getElementById("fullscreenimage") as HTMLImageElement;
    fullscreenimage.src = imagesrc;

    document.getElementById("image-modal-content")!.style.width = "auto";
    document.getElementById("image-modal-content")!.style.height = "auto";

    fullscreenimage.onload = function() {
      if (fullscreenimage.width/window.innerWidth > fullscreenimage.height/window.innerHeight) {
        let imagewidth = fullscreenimage.width;
        let imageheight = fullscreenimage.height;
        document.getElementById("image-modal-content")!.style.width = "90%";
        document.getElementById("image-modal-content")!.style.height = "calc(90vw * (" + imageheight + " / " + imagewidth + ") + 35px)";
      } else {
        let imagewidth = fullscreenimage.width;
        let imageheight = fullscreenimage.height;
        document.getElementById("image-modal-content")!.style.height = "90%";
        document.getElementById("image-modal-content")!.style.width = "calc(90vh * (" + imagewidth + " / " + imageheight + ") - 35px)";
      }
    }

    let modal = document.getElementById("imageModal");
    modal!.style.display = "block";
  }

  public closeFullscreen() {
    let modal = document.getElementById("imageModal");
    modal!.style.display = "none";
  }

  public addRoom() {
    this.room_image = "";
    let modal = document.getElementById("roomModal");
    modal!.style.display = "block";
  }

  public cancelAddingRoom() {
    let modal = document.getElementById("roomModal");
    modal!.style.display = "none";
  }

  public createRoom(name: HTMLInputElement, description: HTMLTextAreaElement, category: MatSelect, password: HTMLInputElement, passwordRepeat: HTMLInputElement) {
    if (name.value.trim() != '' && category.value != 0 && password.value.trim() != '' && password.value.trim() == passwordRepeat.value.trim()) {
      if (this.room_image == "") {
        let randomNumber = Math.floor(Math.random() * 4) + 1;
        this.room_image = "standard" + randomNumber;
      }
      let roomRef = database.ref('/rooms/');
      let newRoomKey = roomRef.push().key;
      roomRef.child(newRoomKey).child('roomData').update({
        admin: userid,
        category: parseInt(category.value),
        description: description.value.trim(),
        image: this.room_image,
        name: name.value.trim(),
        password: password.value.trim(),
        time: this.getCurrentTime()
      });
      let modal = document.getElementById("roomModal");
      modal!.style.display = "none";
      name.value = '';
      description.value = '';
      password.value = '';
      passwordRepeat.value = '';
      category.value = 0;
      this.room_image = '';
    }
  }

  public onFileUpload(event: any, type: number) {
    const uuid = require('uuid');
    let imageName = uuid.v4();

    if (type == 0) {
      if (this.roomkey != "") {
        let time = this.getCurrentTime();
        let rk = this.roomkey;
        
        let file = event.target.files[0];
        let storageRef = storage.ref();
        let quoteid = this.quote;
        this.quote = "";
        document.getElementById("quotebox")!.style.display = "none";
        document.getElementById("chatbox")!.style.maxHeight = "calc(100vh - 95px)"
  
        storageRef.child('images/' + imageName).put(file).then(function(snapshot) {
          console.log("upload successful");
          let messageRef = database.ref('/rooms/' + rk + '/messages');
          let newMessageKey = messageRef.push().key;
          messageRef.child(newMessageKey).update({
            image: imageName,
            text: "",
            sender: userid,
            pinned: false,
            forwarded: false,
            quote: quoteid,
            time: time
          });
        }, function(error) {
          console.log("upload failed");
        })
      }
    } else if (type == 1) {
      let file = event.target.files[0];
      let storageRef = storage.ref();

      this.room_image = imageName;

      storageRef.child('room_images/' + imageName).put(file).then(function(snapshot) {
        console.log("upload successful");
      }, function(error) {
        console.log("upload failed");
      })
    } else if (type == 2) {
      let file = event.target.files[0];
      let storageRef = storage.ref();

      this.profile_image = imageName;

      storageRef.child('profile_images/' + imageName).put(file).then(function(snapshot) {
        console.log("upload successful");
      }, function(error) {
        console.log("upload failed");
      })
    } else if (type == 3) {
      let file = event.target.files[0];
      let storageRef = storage.ref();

      this.profile_banner = imageName;

      storageRef.child('profile_banners/' + imageName).put(file).then(function(snapshot) {
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

  public openMessageMenu({ x, y }: MouseEvent, messageid: String) {
    this.cm_message = messageid.toString();
    let modalcontent = document.getElementById("contextmenu");
    let m = messagelist.find(x => x.key == messageid);
    if (m!.image == "") {
      document.getElementById('cmdownloadbutton')!.style.display = "none";
    } else {
      document.getElementById('cmdownloadbutton')!.style.display = "";
    }
    if (!m!.pinned) {
      document.getElementById('pin_button_text')!.innerHTML = this.translatepipe.transform("PIN");
      let pin_icon = document.getElementById('pin_icon') as HTMLImageElement;
      if (this.theme == 'dark') {
        pin_icon.src = "assets/img/ic_pin_dark.png";
      } else {
        pin_icon.src = "assets/img/ic_pin.png";
      }
    } else {
      document.getElementById('pin_button_text')!.innerHTML = this.translatepipe.transform("UNPIN");
      let pin_icon = document.getElementById('pin_icon') as HTMLImageElement;
      if (this.theme == 'dark') {
        pin_icon.src = "assets/img/ic_unpin_dark.png";
      } else {
        pin_icon.src = "assets/img/ic_unpin.png";
      }
    }
    if (y < 200) {
      modalcontent!.style.top = "200px";
    } else {
      modalcontent!.style.top = y + "px";
    }
    modalcontent!.style.left = x + "px";
    modalcontent!.style.display = "flex";
    return false;
  }

  public quoteMessage() {
    this.quote = this.cm_message;
    document.getElementById("quotebox")!.style.display = "flex";
    document.getElementById("chatbox")!.style.maxHeight = "calc(100vh - 130px)"
    if (messagelist.find(x => x.key == this.quote)!.userid == this.userid) {
      document.getElementById("quotetext")!.innerHTML = this.translatepipe.transform("YOU") + ": " + messagelist.find(x => x.key == this.quote)!.text.toString();
    } else {
      document.getElementById("quotetext")!.innerHTML = messagelist.find(x => x.key == this.quote)!.sender.toString() + ": " + messagelist.find(x => x.key == this.quote)!.text.toString();
    }
    if(messagelist.find(x => x.key == this.quote)!.image != "") {
      document.getElementById('quoteimage')!.style.display = "block";
      (document.getElementById('quoteimage') as HTMLImageElement).src = String(messagelist.find(x => x.key == this.quote)!.image);
    } else {
      document.getElementById('quoteimage')!.style.display = "none";
    }
    document.getElementById("messageinput")!.focus();
  }

  public cancelQuote() {
    this.quote = "";
    document.getElementById("quotebox")!.style.display = "none";
    document.getElementById("chatbox")!.style.maxHeight = "calc(100vh - 95px)"
  }

  public forwardMessage() {
    if (roomlist.length > 1) {
      let modal = document.getElementById("forwardModal");
      modal!.style.display = "block";
    }
  }

  public cancelForwarding() {
    let modal = document.getElementById("forwardModal");
    modal!.style.display = "none";
  }

  public forwardTo(roomkey: String) {
    let modal = document.getElementById("forwardModal");
    modal!.style.display = "none";
    let message = messagelist.find(x => x.key == this.cm_message);
    let messageRef = database.ref('/rooms/' + roomkey + '/messages');
    let newMessageKey = messageRef.push().key;
    messageRef.child(newMessageKey).update({
      image: "",
      text: message.text,
      sender: userid,
      pinned: false,
      forwarded: true,
      quote: "",
      time: this.getCurrentTime()
    });

    this.showToast(this.translatepipe.transform("MESSAGE FORWARDED"));
  }

  public jumpToQuotedMessage(messageid: String) {
    let quoteid = messagelist.find(x => x.key == messageid)!.quote;
    if (quoteid != "") {
      let targetMessage = document.getElementById('message_' + quoteid)
      document.getElementById('messages')!.scrollTop = (targetMessage!.offsetTop - 125);
      targetMessage!.style.background = "grey";
      setTimeout(function() {
        targetMessage!.style.background = "none";
      }, 1000);
    }
  }

  public jumpToPinnedMessage(messageid: String) {
    document.getElementById('roomInfoModal')!.style.display = "none";
    document.getElementById('pinboardModal')!.style.display = "none";
    let targetMessage = document.getElementById('message_' + messageid)
    document.getElementById('messages')!.scrollTop = (targetMessage!.offsetTop - 125);
    targetMessage!.style.background = "grey";
    setTimeout(function() {
      targetMessage!.style.background = "none";
    }, 1000);
  }

  public pinMessage() {
    let m = messagelist.find(x => x.key == this.cm_message)
    if (!m!.pinned) {
      m!.pinned = true
      database.ref('/rooms/' + this.roomkey + '/messages/' + this.cm_message + '/pinned').set(true);
      this.showToast(this.translatepipe.transform("MESSAGE PINNED"));
    } else {
      m!.pinned = false
      database.ref('/rooms/' + this.roomkey + '/messages/' + this.cm_message + '/pinned').set(false);
      this.showToast(this.translatepipe.transform("MESSAGE UNPINNED"));
    }
  }

  public openEditProfile() {
    (document.getElementById('edit_profile_name') as HTMLInputElement).value = String(this.currentUser.name);
    (document.getElementById('edit_profile_bio') as HTMLInputElement).value = String(this.currentUser.description);
    (document.getElementById('edit_profile_birthday') as HTMLInputElement).value = String(this.currentUser.birthday).substring(6, 10) + "-" + String(this.currentUser.birthday).substring(3, 5) + "-" + String(this.currentUser.birthday).substring(0, 2);
    (document.getElementById('edit_profile_location') as HTMLInputElement).value = String(this.currentUser.location);
    (document.getElementById('profile_image_input') as HTMLInputElement).src = String(this.currentUser.profile_image);
    (document.getElementById('profile_banner_input') as HTMLInputElement).src = String(this.currentUser.profile_banner);
    document.getElementById('editProfileModal')!.style.display = "block";
  }

  public cancelEditProfile() {
    document.getElementById('editProfileModal')!.style.display = "none";
    this.profile_banner = "";
    this.profile_image = "";
  }

  public editProfile(name: string, description: string, birthday: string, location: string) {
    if (name.trim() != '' && birthday != '0' && location.trim()) {
      database.ref('/users/' + userid + '/name').set(name);
      database.ref('/users/' + userid + '/description').set(description);
      database.ref('/users/' + userid + '/birthday').set(birthday.replace(/-/g, ""));
      database.ref('/users/' + userid + '/location').set(location);
      if (this.profile_image != "") {
        database.ref('/users/' + userid + '/image').set(this.profile_image);
        database.ref('/users/' + userid + '/ownProfileImage').set(true);
      }
      if (this.profile_banner != "") {
        database.ref('/users/' + userid + '/banner').set(this.profile_banner);
      }
      document.getElementById('editProfileModal')!.style.display = "none";
      this.currentUser.name = name;
      this.currentUser.description = description;
      this.currentUser.birthday = birthday.substring(8, 10) + "." + birthday.substring(5, 7) + "." + birthday.substring(0, 4);
      this.currentUser.location = location;

      this.profile_banner = "";
      this.profile_image = "";

      this.showToast(this.translatepipe.transform("PROFILE EDITED"));
    }
  }

  public showToast(message: string) {
    document.getElementById('toast')!.style.display = "block";
    document.getElementById('toasttext')!.innerHTML = message;
    setTimeout(function() {
      document.getElementById('toast')!.style.display = "none";
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
    a.href = await this.toDataURL(new URL(m!.image.toString()));
    let currentdate = this.getCurrentTime();
    a.download = "MyChatApp_" + currentdate.substring(0, 15);
    a.click();
  }

  toDataURL(url: URL) {
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

  public openRoomInfo() {
    document.getElementById("roomInfoModal")!.style.display = "block";
  }

  public closeRoomInfo() {
    document.getElementById('roomInfoModal')!.style.display = "none";
  }

  public convertCategory(categoryID: number): string {
    switch (categoryID) {
      case 1:
        return this.translatepipe.transform("STUDY AND WORK");
      case 2:
        return this.translatepipe.transform("GAMING");
      case 3:
        return this.translatepipe.transform("POLITICS");
      case 4:
        return this.translatepipe.transform("GEOGRAPHY");
      case 5:
        return this.translatepipe.transform("LANGUAGES");
      case 6:
        return this.translatepipe.transform("LITERATURE");
      case 7:
        return this.translatepipe.transform("TECHNICS");
      case 8:
        return this.translatepipe.transform("TV");
      case 9:
        return this.translatepipe.transform("SPORTS");
      case 10:
        return this.translatepipe.transform("CULTURE AND ART");
      case 11:
        return this.translatepipe.transform("MUSIC");
      case 12:
        return this.translatepipe.transform("MISC");
      default:
        return ""; // TODO
    }
  }

  public openEditRoom() {
    (document.getElementById('edit_room_name') as HTMLInputElement).value = String(this.room.name);
    (document.getElementById('edit_room_description') as HTMLInputElement).value = String(this.room.description);
    this.selectedCategory = String(this.room.category);
    (document.getElementById('edit_room_password') as HTMLInputElement).value = String(this.room.password);
    (document.getElementById('edit_room_confirm_password') as HTMLInputElement).value = String(this.room.password);
    this.room_image = this.room.image.toString();
    document.getElementById("editRoomModal")!.style.display = "block";
  }

  public cancelEditingRoom() {
    document.getElementById('editRoomModal')!.style.display = "none";
  }

  public editRoom(name: HTMLInputElement, description: HTMLTextAreaElement, category: MatSelect, password: HTMLInputElement, passwordRepeat: HTMLInputElement) {
    if (name.value.trim() != '' && category.value != 0 && password.value.trim() != '' && password.value.trim() == passwordRepeat.value.trim()) {
      if (this.room_image == "") {
        let randomNumber = Math.floor(Math.random() * 4) + 1;
        this.room_image = "standard" + randomNumber;
      }
      let roomRef = database.ref('/rooms/');
      roomRef.child(this.roomkey).child('roomData').update({
        category: parseInt(category.value),
        description: description.value.trim(),
        // image: this.room_image, // TODO
        name: name.value.trim(),
        password: password.value.trim(),
      });
      let modal = document.getElementById("editRoomModal");
      modal!.style.display = "none";
      this.room.name = name.value.trim();
      this.room.description = description.value.trim();
      this.room.category = parseInt(category.value);
      name.value = '';
      description.value = '';
      password.value = '';
      passwordRepeat.value = '';
      category.value = 0;
      this.room_image = '';
    }
  }

  public openDeleteRoom() {
    document.getElementById("deleteRoomModal")!.style.display = "block";
  }

  public cancelDeleteRoom() {
    document.getElementById('deleteRoomModal')!.style.display = "none";
  }

  public deleteRoom() {
    let roomRef = database.ref('/rooms/');
    roomRef.child(this.roomkey).remove();
    document.getElementById('deleteRoomModal')!.style.display = "none";
    document.getElementById('roomInfoModal')!.style.display = "none";
    this.roomkey = "";
    this.room = null;
    document.getElementById('headeritem')!.style.display = "none";
    document.getElementById('inputbox')!.style.display = "none";
    document.getElementById('roomheader')!.style.display = "none";
    document.getElementById('noroom')!.style.display = "block";
    messagelist = [];
    this.items_messages.next(messagelist);
  }

  public openPinboard() {
    document.getElementById("pinboardModal")!.style.display = "block";
    let pinnedList = messagelist.filter(m => m.pinned);
    this.items_pinned.next(pinnedList);
  }

  public closePinboard() {
    document.getElementById("pinboardModal")!.style.display = "none";
  }

  public openUserMenu() {
    if (document.getElementById("usermenu")!.style.display != "flex") {
      document.getElementById("usermenu")!.style.display = "flex";
    } else {
      document.getElementById("usermenu")!.style.display = "none";
    }
  }
}