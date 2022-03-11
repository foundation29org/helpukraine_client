import { Component, ViewChild, OnInit, OnDestroy, LOCALE_ID, Injectable, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { EventsService } from 'app/shared/services/events.service';
import { sha512 } from "js-sha512";
import { Observable, of, OperatorFunction } from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'
import { DateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { SortService } from 'app/shared/services/sort.service';
import { v4 as uuidv4 } from 'uuid';

import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TermsConditionsPageComponent } from "../terms-conditions/terms-conditions-page.component";
import { DataProcessingAgreementComponent } from "../data-processing-agreement/data-processing-agreement.component";
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

export function getCulture() {
  return sessionStorage.getItem('culture');
}

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
  providers: [{ provide: LOCALE_ID, useFactory: getCulture }, ApiDx29ServerService]

})

export class RegisterPageComponent implements OnDestroy, OnInit {

  @ViewChild('f') registerForm: NgForm;
  sending: boolean = false;

  isVerifyemail: boolean = false;
  isEmailBusy: boolean = false;
  isFailEmail: boolean = false;

  termso: boolean = false;
  openedTerms: boolean = false;
  isApp: boolean = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  role: string = 'Clinical';
  subrole: string = 'null';

  emailpar1: string = null;
  emailpar2: string = null;
  datainfo: any;
  private subscriptionDiseasesCall: Subscription = new Subscription();
  myuuid: string = uuidv4();
  lang: string = 'en';
  phoneCodes:any=[];
  phoneCodeSelected:String="";
  seleccionado: string = null;

  private subscription: Subscription = new Subscription();

  constructor(private router: Router, private http: HttpClient, public translate: TranslateService, private modalService: NgbModal, private route: ActivatedRoute, private dateAdapter: DateAdapter<Date>, private datePipe: DatePipe, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private eventsService: EventsService) {

    this.lang = sessionStorage.getItem('lang');

    this.subscription.add(this.route.params.subscribe(params => {
      if (params['role'] != undefined) {
        this.role = params['role'];
      }
      if (params['subrole'] != undefined) {
        this.subrole = params['subrole'];
      }
    }));

    var paramurlinit = this.router.parseUrl(this.router.url).queryParams;
    if (paramurlinit.email) {
      this.emailpar1 = paramurlinit.email;
      this.emailpar2 = paramurlinit.email;
    }

    this.datainfo = {
      patientName: '',
      surname: '',
      street: '',
      postalCode: '',
      citybirth: '',
      provincebirth: '',
      countrybirth: null,
      city: '',
      province: '',
      country: null,
      phone1: '',
      phone2: '',
      birthDate: null,
      gender: null,
      siblings: [],
      parents: []
    };
    this.dateAdapter.setLocale(sessionStorage.getItem('lang'));

    this.loadPhoneCodes();
  }

  ngOnInit() {

    this.eventsService.on('changelang', function (lang) {
      if (lang != this.lang) {
        this.lang = lang;
      }

    }.bind(this));

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();

    if (this.subscriptionDiseasesCall) {
      this.subscriptionDiseasesCall.unsubscribe();
    }
  }

  loadPhoneCodes(){
    //cargar la lista mundial de ciudades
    this.subscription.add( this.http.get('assets/jsons/phone_codes.json')
    .subscribe( (res : any) => {
      for (var i=0;i<res.length;i++){
        var phoneCodeList=res[i].phone_code.split(/["]/g)
        var phoneCode="+"+phoneCodeList[1]
        var countryNameCode="";
        var countryNameCodeList=[];
        if(this.lang=="es"){
          countryNameCodeList=res[i].nombre.split(/["]/g)
        }
        else{
          countryNameCodeList=res[i].name.split(/["]/g)
        }
        countryNameCode=countryNameCodeList[1]
        this.phoneCodes.push({countryCode:countryNameCode,countryPhoneCode:phoneCode})
      }
      this.phoneCodes.sort(this.sortService.GetSortOrder("countryCode"));

    }));

  }

  codePhoneChange(event, value){
    var phoneCode=value.split(" ")
    this.phoneCodeSelected=phoneCode;
  }

  // Open content Privacy Policy
  openTerms() {
    this.openedTerms = true;
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'
    };
    const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
    modalRef.componentInstance.role = this.role;
    modalRef.componentInstance.subrole = this.subrole;
  }

  openDataProcessingAgreement() {
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'
    };
    this.modalService.open(DataProcessingAgreementComponent, ngbModalOptions);
  }

  submitInvalidForm() {
    if (!this.registerForm) { return; }
    const base = this.registerForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
      }
    }
  }

  //  On submit click, reset field value
  onSubmit() {
    if (this.registerForm.value.role == 'User' && (this.registerForm.value.subrole == 'null' || this.registerForm.value.subrole == null)) {
      Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.select the type of patient1"), "warning");
    } else {
      this.sending = true;
      this.isVerifyemail = false;
      this.isEmailBusy = false;
      this.isFailEmail = false;
      //codificar el password
      this.registerForm.value.password = sha512(this.registerForm.value.password);
      this.registerForm.value.password2 = sha512(this.registerForm.value.password2);
      this.registerForm.value.email = (this.registerForm.value.email).toLowerCase();
      this.registerForm.value.lang = this.translate.store.currentLang;

      var params = this.registerForm.value;
      params.permissions = {};
      params.role = "User";
      if (params.role == 'Clinical') {
        params.subrole = null
      }
      //params.phone = params.countryselectedPhoneCode+ " " +params.phone;
      this.subscription.add(this.http.post(environment.api + '/api/signup', params)
        .subscribe((res: any) => {
          if (res.message == 'Account created') {
            this.isVerifyemail = true;
            Swal.fire('', this.translate.instant("registration.Check the email")+' support@foundation29.org', "success");
          } else if (res.message == 'Fail sending email') {
            console.log("email fallido");
            this.isFailEmail = true;
            Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.could not be sent to activate"), "warning");
          } else if (res.message == 'user exists') {
            this.isEmailBusy = true;
            Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.email already exists"), "warning");
          }
          this.registerForm.reset();
          this.sending = false;
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.registerForm.reset();
          this.sending = false;
        }));
    }


  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  roleChange(role) {
    this.subrole = "null";
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }


}
