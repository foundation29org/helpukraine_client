import { Component, OnInit, Input, ViewChild, OnDestroy, ElementRef, Renderer2, AfterViewInit } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ROUTES, ROUTESHAVEDIAGNOSIS, ROUTESSUPERADMIN, ROUTESCLINICAL, ROUTESHOMEDX, ROUTESADMINGTP} from './sidebar-routes.config';
import { RouteInfo } from "./sidebar.metadata";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { customAnimations } from "../animations/custom-animations";
import { ConfigService } from '../services/config.service';
import { LayoutService } from '../services/layout.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'app/shared/auth/auth.service';
import { EventsService} from 'app/shared/services/events.service';
import { Data } from 'app/shared/services/data.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import Swal from 'sweetalert2';

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  animations: customAnimations,
  providers: [ApiDx29ServerService]
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('toggleIcon') toggleIcon: ElementRef;
  public menuItems: any[];
  depth: number;
  activeTitle: string;
  activeTitles: string[] = [];
  expanded: boolean;
  nav_collapsed_open = false;
  logoUrl = 'assets/img/logo.png';
  public config: any = {};
  layoutSub: Subscription;
  urlLogo: string = 'assets/img/logo-raito.png';
  urlLogo2: string = 'assets/img/logo-raito.png';
  redirectUrl: string = '';
  isHomePage: boolean = false;
  private subscription: Subscription = new Subscription();
  permGPT3: boolean = false;
  searchGpt3: string = '';
  callingGpt3: boolean = false;
  showGTP: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    public translate: TranslateService,
    private configService: ConfigService,
    private layoutService: LayoutService,
    private authService: AuthService,
    private eventsService: EventsService,
     private dataservice: Data,
     private http: HttpClient,
     private apiDx29ServerService: ApiDx29ServerService
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
      this.expanded = true;
    }
    this.layoutSub = layoutService.customizerChangeEmitted$.subscribe(
      options => {
        if (options) {
          if (options.bgColor) {
            if (options.bgColor === 'white') {
              this.logoUrl = 'assets/img/logo-dark.png';
            }
            else {
              this.logoUrl = 'assets/img/logo.png';
            }
          }
          if (options.compactMenu === true) {
            this.expanded = false;
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = true;
          }
          else if (options.compactMenu === false) {
            this.expanded = true;
            this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
            this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
            this.nav_collapsed_open = false;
          }

        }
      });


    this.redirectUrl = this.authService.getRedirectUrl();


    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl= (event.url).toString().split('?');
        var actualUrl = tempUrl[0];
        var tempUrl1 = (actualUrl).toString();
        this.showGTP = false;
        if(tempUrl1.indexOf('/home')!=-1){
          this.isHomePage = true;
        }else{
          this.isHomePage = false;
        }
        if(this.authService.getRole() == 'SuperAdmin'){
          //cargar menú del Admin
          this.menuItems = ROUTESSUPERADMIN.filter(menuItem => menuItem);
        }else if(this.authService.getRole() == 'Clinical'){
          //cargar menú del Clinical
          this.menuItems = ROUTESCLINICAL.filter(menuItem => menuItem);
        }
        else if(this.authService.getRole() == 'Admin'){
          if(this.authService.getSubRole() == 'AdminGTP'){
            this.menuItems = ROUTESADMINGTP.filter(menuItem => menuItem);
          }
        }
        else if(this.authService.getRole() != undefined){
          //cargar menú del usuario
          this.menuItems = ROUTESHAVEDIAGNOSIS.filter(menuItem => menuItem);
          this.showGTP = true;

        }else if(this.authService.getRole() == undefined){
          this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
        }
      }
    );
  }


  ngOnInit() {
    this.config = this.configService.templateConf;
    this.showGTP = false;
    if(this.authService.getRole() == 'SuperAdmin'){
      //cargar menú del Admin
      this.menuItems = ROUTESSUPERADMIN.filter(menuItem => menuItem);
    }else if(this.authService.getRole() == 'Clinical'){
      //cargar menú del Clinical
      this.menuItems = ROUTESCLINICAL.filter(menuItem => menuItem);
    }
    else if(this.authService.getRole() == 'Admin'){
      if(this.authService.getSubRole() == 'AdminGTP'){
        this.menuItems = ROUTESADMINGTP.filter(menuItem => menuItem);
      }
    }
    else if(this.authService.getRole() != undefined){
      //cargar menú del usuario
      this.menuItems = ROUTESHAVEDIAGNOSIS.filter(menuItem => menuItem);
      this.showGTP = true;
    }else if(this.authService.getRole() == undefined){
      this.menuItems = ROUTESHOMEDX.filter(menuItem => menuItem);
    }
    if (this.config.layout.sidebar.backgroundColor === 'white') {
      this.logoUrl = 'assets/img/logo-dark.png';
    }
    else {
      this.logoUrl = 'assets/img/logo.png';
    }
    //this.getGtp3Perm();
  }

  ngAfterViewInit() {

    setTimeout(() => {
      if (this.config.layout.sidebar.collapsed != undefined) {
        if (this.config.layout.sidebar.collapsed === true) {
          this.expanded = false;
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = true;
        }
        else if (this.config.layout.sidebar.collapsed === false) {
          this.expanded = true;
          this.renderer.removeClass(this.toggleIcon.nativeElement, 'ft-toggle-left');
          this.renderer.addClass(this.toggleIcon.nativeElement, 'ft-toggle-right');
          this.nav_collapsed_open = false;
        }
      }
    }, 0);


  }

  ngOnDestroy() {
    if (this.layoutSub) {
      this.layoutSub.unsubscribe();
    }
  }

  toggleSlideInOut() {
    this.expanded = !this.expanded;
  }

  handleToggle(titles) {
    this.activeTitles = titles;
  }

  // NGX Wizard - skip url change
  ngxWizardFunction(path: string) {
    if (path.indexOf("forms/ngx") !== -1)
      this.router.navigate(["forms/ngx/wizard"], { skipLocationChange: false });
  }

  getGtp3Perm() {
    this.subscription.add(this.http.get(environment.api + '/api/gpt3/' + this.authService.getIdUser())
      .subscribe((res: any) => {
        this.permGPT3 = res.gptPermission;
      }, (err) => {
        console.log(err);
      }));

  }

  setGtp3Perm() {
    var value = { gptPermission: this.permGPT3 };
    this.subscription.add( this.http.post(environment.api+'/api/gpt3/'+this.authService.getIdUser(), value)
      .subscribe((res: any) => {
        if(this.permGPT3){
          this.searchOpenAi();
        }
      }, (err) => {
        console.log(err);
      }));

  }

  setGtp3NumCalls() {
    this.subscription.add( this.http.get(environment.api+'/api/gpt3/numcalls/'+this.authService.getIdUser())
      .subscribe((res: any) => {
      }, (err) => {
        console.log(err);
      }));

  }

  searchOpenAi() {
    if(this.searchGpt3.length<3){
      Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("homeraito.Type a question in the text box"), "warning");
    }else{
      if (!this.permGPT3) {
        Swal.fire({
          title: 'Disclaimer',
          html: this.translate.instant("homeraito.MsgDisclaimer"),
          input: 'text',
          confirmButtonText: this.translate.instant("homeraito.I agree"),
          cancelButtonText: this.translate.instant("generics.Cancel"),
          showCancelButton: true,
          reverseButtons: true
        }).then(function (email) {
          if (email.value) {
            console.log('acepta');
            this.permGPT3 = true;
          } else {
            console.log('rechaza');
            this.permGPT3 = false;
          }
          this.setGtp3Perm();
        }.bind(this))
      } else {
        var value = { value: this.searchGpt3 };
        this.callingGpt3 = true;
        this.subscription.add(this.apiDx29ServerService.callOpenAi(value)
          .subscribe((res: any) => {
            this.callingGpt3 = false;
            Swal.fire({
              title: this.searchGpt3,
              html: res.choices[0].text,
              willClose: () => {
                this.searchGpt3 = '';
              }
            }).then((result) => {
              this.searchGpt3 = '';
            })
            this.setGtp3NumCalls();
          }, (err) => {
            console.log(err);
            this.callingGpt3 = false;
          }));
      }
    }
    

  }

}
