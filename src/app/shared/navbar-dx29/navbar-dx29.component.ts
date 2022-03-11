import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { environment } from 'environments/environment';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { LangService } from 'app/shared/services/lang.service';
import { EventsService } from 'app/shared/services/events.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Injectable, Injector } from '@angular/core';

declare let gtag: any;

@Component({
  selector: 'app-navbar-dx29',
  templateUrl: './navbar-dx29.component.html',
  styleUrls: ['./navbar-dx29.component.scss'],
  providers: [LangService, ApiDx29ServerService]
})

@Injectable()
export class NavbarD29Component implements OnInit, AfterViewInit, OnDestroy {
  currentLang = 'en';
  toggleClass = 'ft-maximize';
  placement = "bottom-right";
  public isCollapsed = true;
  layoutSub: Subscription;
  @Output()
  toggleHideSidebar = new EventEmitter<Object>();

  public config: any = {};
  langs: any;
  isHomePage: boolean = false;
  isClinicianPage: boolean = false;
  isPatientPage: boolean = false;
  isUndiagnosedPatientPage: boolean = false;
  isEdHubPage: boolean = false;
  isAboutPage: boolean = false;
  isDonaPage: boolean = false;
  role: string = 'Clinical';
  subrole: string = 'null';
  _startTime: any;
  private subscription: Subscription = new Subscription();

  constructor(public translate: TranslateService, private layoutService: LayoutService, private configService: ConfigService, private langService: LangService, private router: Router, private route: ActivatedRoute, private inj: Injector, private apiDx29ServerService: ApiDx29ServerService) {

    this.loadLanguages();

    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        console.log(tempUrl);
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isAboutPage = false;
          this.role = 'Clinical';
          this.subrole = 'null';
        } else if (tempUrl.indexOf('/aboutus') != -1) {
          this.isHomePage = false;
          this.isAboutPage = true;
        } else {
          this.isHomePage = false;
          this.isAboutPage = false;
        }
      }
    );

    this.layoutSub = layoutService.changeEmitted$.subscribe(
      direction => {
        const dir = direction.direction;
        if (dir === "rtl") {
          this.placement = "bottom-left";
        } else if (dir === "ltr") {
          this.placement = "bottom-right";
        }
      });

    this._startTime = Date.now();
  }

  ngOnInit() {
    this.config = this.configService.templateConf;
  }

  ngAfterViewInit() {
    if (this.config.layout.dir) {
      setTimeout(() => {
        const dir = this.config.layout.dir;
        if (dir === "rtl") {
          this.placement = "bottom-left";
        } else if (dir === "ltr") {
          this.placement = "bottom-right";
        }
      }, 0);

    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  ToggleClass() {
    if (this.toggleClass === "ft-maximize") {
      this.toggleClass = "ft-minimize";
    } else {
      this.toggleClass = "ft-maximize";
    }
  }

  toggleNotificationSidebar() {
    this.layoutService.emitNotiSidebarChange(true);
  }

  toggleSidebar() {
    const appSidebar = document.getElementsByClassName("app-sidebar")[0];
    if (appSidebar.classList.contains("hide-sidebar")) {
      this.toggleHideSidebar.emit(false);
    } else {
      this.toggleHideSidebar.emit(true);
    }
  }

  loadLanguages() {
    this.subscription.add(this.langService.getLangs()
      .subscribe((res: any) => {
        this.langs = res;
        if (sessionStorage.getItem('lang')) {
          this.translate.use(sessionStorage.getItem('lang'));
          this.searchLangName(sessionStorage.getItem('lang'));
        } else {
          const browserLang: string = this.translate.getBrowserLang();
          var foundlang = false;
          for (let lang of this.langs) {
            if (browserLang.match(lang.code)) {
              this.translate.use(lang.code);
              foundlang = true;
              sessionStorage.setItem('lang', lang.code);
              this.searchLangName(lang.name);
            }
          }
          if (!foundlang) {
            sessionStorage.setItem('lang', this.translate.store.currentLang);
          }
        }

      }, (err) => {
        console.log(err);
      }));
  }

  searchLangName(code: string) {
    for (let lang of this.langs) {
      var actualLang = sessionStorage.getItem('lang');
      if (actualLang == lang.code) {
        this.currentLang = lang.code;
      }
    }
  }

  ChangeLanguage(language: string) {
    this.translate.use(language);
    sessionStorage.setItem('lang', language);
    this.searchLangName(language);
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('changelang', language);
  }

  lauchEvent(category) {
    var secs = this.getElapsedSeconds();
    gtag('event', sessionStorage.getItem('uuid'), { "event_category": category, "event_label": secs });
  }

  getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
  };

  goToLogin(){
    this.router.navigate(['/login']);
  }

  goToRegister(){
    this.router.navigate(['/register']);
  }

}
