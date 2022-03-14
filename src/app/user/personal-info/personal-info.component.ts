import { Component, OnInit, ViewChild, Injectable, LOCALE_ID, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastrService } from 'ngx-toastr';
import { DateService } from 'app/shared/services/date.service';
import { EventsService } from 'app/shared/services/events.service';
import { SortService } from 'app/shared/services/sort.service';
import { ApiExternalServices } from 'app/shared/services/api-external.service';
import { PatientService } from 'app/shared/services/patient.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as chartsData from 'app/shared/configs/general-charts.config';
import { Observable, of, OperatorFunction } from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'

import { v4 as uuidv4 } from 'uuid';
import { DateAdapter } from '@angular/material/core';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

export function getCulture() {
  return sessionStorage.getItem('culture');
}

@Injectable()
export class SearchTermService {
  constructor(private apiDx29ServerService: ApiDx29ServerService) { }

  search(term: string) {
    if (term === '') {
      return of([]);
    }
    var info = {
      "text": term,
      "lang": sessionStorage.getItem('lang')
    }
    return this.apiDx29ServerService.searchDiseases(info).pipe(
      map(response => response)
    );
  }
}

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss'],
  providers: [PatientService, SearchTermService, { provide: LOCALE_ID, useFactory: getCulture }, ApiDx29ServerService, ApiExternalServices]
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
  lang: string = 'en';
  countries: any = [];
  userId: string = '';
  groups: Array<any> = [];
  selectedPatient: any = {};
  loadedPatientId: boolean = false;
  loadedInfoPatient: boolean = false;
  @ViewChild('f') personalInfoForm: NgForm;
  datainfo: any;
  datainfoCopy: any;
  sending: boolean = false;
  countrySelected: string = null;
  searchDiseaseField: string = '';
  callListOfDiseases: boolean = false;
  sendTerms: boolean = false;
  myuuid: string = uuidv4();
  listOfFilteredDiseases: any = [];
  loadingOneDisease: boolean = false;
  selectedDiseaseIndex: number = -1;
  actualInfoOneDisease: any = {};
  nothingFoundDisease: boolean = false;
  private subscription: Subscription = new Subscription();

  //Variable Declaration
  @ViewChild('fWeight') weightForm: NgForm;
  @ViewChild('fHeight') heightForm: NgForm;
  patient: any;
  loadedWeight:boolean = false;
  loadedHeight:boolean = false;
  selectedWeight: any;
  selectedHeight: any;
  actualWeight: any;
  actualHeight: any;
  settingWeight: boolean = false;
  settingHeight: boolean = false;
  footHeight: any;
  weightHistory: any = [];
  heightHistory: any = [];
  modalReference: NgbModalRef;
  editingWeightHistory: boolean = false;
  editingHeightHistory: boolean = false;

  //Chart Data
  lineChartWeight = [];
  lineChartHeight = [];
  //Line Charts

  lineChartView: any[] = chartsData.lineChartView;

  // options
  lineChartShowXAxis = chartsData.lineChartShowXAxis;
  lineChartShowYAxis = chartsData.lineChartShowYAxis;
  lineChartGradient = chartsData.lineChartGradient;
  lineChartShowLegend = chartsData.lineChartShowLegend;
  lineChartShowXAxisLabel = chartsData.lineChartShowXAxisLabel;
  lineChartShowYAxisLabel = chartsData.lineChartShowYAxisLabel;

  lineChartColorScheme = chartsData.lineChartColorScheme;

  // line, area
  lineChartAutoScale = chartsData.lineChartAutoScale;
  lineChartLineInterpolation = chartsData.lineChartLineInterpolation;

  isSafari:boolean = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent && !navigator.userAgent.match('CriOS');
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  isIeOrEdge = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) || /Edge/.test(navigator.userAgent);
  settings: any;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private transWeight: string;
  private transHeight: string;
  private msgDate: string;
  private group: string;
  timeformat="";
  actualLocation: any = {};

  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 4;
  showMarker: boolean = false;

  constructor(private http: HttpClient, public translate: TranslateService, private dateAdapter: DateAdapter<Date>, private authService: AuthService, public toastr: ToastrService, private dateService: DateService, private patientService: PatientService, public searchTermService: SearchTermService, private eventsService: EventsService, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private modalService: NgbModal, private authGuard: AuthGuard, private apiExternalServices: ApiExternalServices) {
    this.dateAdapter.setLocale(this.authService.getLang());
    this.lang =this.authService.getLang();
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
      parents: [],
      group: null,
      previousDiagnosis: null,
      consentgroup: false
    };

    switch(this.authService.getLang()){
      case 'en':
        this.timeformat="M/d/yy";
        break;
      case 'es':
          this.timeformat="d/M/yy";
          break;
      case 'nl':
          this.timeformat="d-M-yy";
          break;
      default:
          this.timeformat="M/d/yy";
          break;

    }

    this.loadCountries();
    this.loadGroups();

   }

   loadGroups(){
    this.subscription.add( this.apiDx29ServerService.loadGroups()
    .subscribe( (res : any) => {
      console.log(res);
      this.groups = res;
      this.groups.sort(this.sortService.GetSortOrder("name"));
    }, (err) => {
      console.log(err);
    }));    
   }

  ngOnInit(): void {
    this.group =  this.authService.getGroup();

    this.patient = {
    };

    this.selectedWeight = {
      value: null,
      date: null,
      _id: null
    };

    this.actualWeight = {
      value: null,
      date: null,
      _id: null
    };

    this.selectedHeight = {
      value: null,
      date: null,
      technique: null,
      _id: null
    };

    this.footHeight = {
      feet: null,
      inches: null
    };

    this.actualHeight = {
      value: null,
      date: null,
      technique: null,
      _id: null
    };

    this.settings = {
      lengthunit: null,
      massunit: null
    };

    this.loadTranslations();

    //cargar preferencias de la cuenta
    this.subscription.add( this.http.get(environment.api+'/api/users/settings/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      this.settings.lengthunit = res.user.lengthunit;
      this.settings.massunit = res.user.massunit;
     }, (err) => {
       console.log(err);
     }));
     this.loadEnvir();
     this.loadSettings();

    this.initEnvironment();

    /*this.eventsService.on('changelang', function (lang) {
      if (lang != this.lang) {
        this.lang = lang;
        this.loadCountries();
      }

    }.bind(this));*/
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadCountries() {
    this.countries = [];
    //load countries file
    this.subscription.add(this.http.get('assets/jsons/phone_codes.json')
      .subscribe((res: any) => {
        //get country name
        for (let row of res) {
          var countryName = "";
          var countryNameList = [];
          countryNameList = row.name.split(/["]/g)
          countryName = countryNameList[1]

          var countryNombre = "";
          var countryNombreList = [];
          countryNombreList = row.nombre.split(/["]/g)
          countryNombre = countryNombreList[1]
          this.countries.push({ countryName: countryName, countryNombre: countryNombre })
        }
        if (this.lang == 'es') {
          this.countries.sort(this.sortService.GetSortOrder("countryNombre"));
        } else {
          this.countries.sort(this.sortService.GetSortOrder("countryName"));
        }
      }));

  }

  initEnvironment(){
    this.userId = this.authService.getIdUser();
    if(this.authService.getCurrentPatient()==null){
      this.loadPatientId();
    }else{
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.getInfoPatient();
    }
  }

  loadPatientId(){
    this.loadedPatientId = false;
    this.subscription.add( this.patientService.getPatientId()
    .subscribe( (res : any) => {
      console.log(res);
      if(res==null){
        this.authService.logout();
      }else{
        this.loadedPatientId = true;
        this.authService.setCurrentPatient(res);
        this.selectedPatient = res;
        this.getInfoPatient();
      }
     }, (err) => {
       console.log(err);
     }));
  }


  getLocationInfo(){
    this.subscription.add(this.apiExternalServices.getInfoLocation()
        .subscribe((res: any) => {
            console.log(res);
            this.actualLocation = res;
        }, (err) => {
            console.log(err);
        }));
  }

  getInfoPatient(){
    this.getLocationInfo();
    this.loadedInfoPatient = false;
    this.subscription.add( this.http.get(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub)
        .subscribe( (res : any) => {
          console.log(res);
          this.datainfo = res.patient;
          this.datainfo.birthDate=this.dateService.transformDate(res.patient.birthDate);
          this.datainfoCopy = JSON.parse(JSON.stringify(res.patient));
          if(res.patient.previousDiagnosis!=null){
            this.searchDiseases2(res.patient.previousDiagnosis);
          }
          
          this.loadedInfoPatient = true;
         }, (err) => {
           console.log(err);
           this.loadedInfoPatient = true;
           this.toastr.error('', this.translate.instant("generics.error try again"));
         }));
  }
  
  closeDatePickerStart(eventData: any, dp?: any) {
    // get month and year from eventData and close datepicker, thus not allowing user to select date
    this.datainfo.birthDate = eventData;
    dp.close();
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }

  submitInvalidForm() {
    console.log('qagag');
    if (!this.personalInfoForm) { return; }
    const base = this.personalInfoForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
      }
    }
  }

  //  On submit click, reset field value
  onSubmit() {
    console.log('eop');
    if (this.personalInfoForm.value.role == 'User' && (this.personalInfoForm.value.subrole == 'null' || this.personalInfoForm.value.subrole == null)) {
      Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.select the type of patient1"), "warning");
    } else {
      this.sending = true;
      var params = this.personalInfoForm.value;
      params.permissions = {};
      params.gender = this.datainfo.gender;

      if (this.datainfo.birthDate != null) {
        this.datainfo.birthDate  = this.dateService.transformDate(this.datainfo.birthDate );
      }
      this.datainfo.previousDiagnosis = this.actualInfoOneDisease.id;
      console.log(this.datainfo);
      this.subscription.add( this.http.put(environment.api+'/api/patients/'+this.authService.getCurrentPatient().sub, this.datainfo)
        .subscribe((res: any) => {
          this.sending = false;
          this.loadEnvir();
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));
    }


  }

  focusOutFunctionDiseases() {
    if (this.searchDiseaseField.trim().length > 3 && !this.callListOfDiseases) {
      //send text
      var tempModelTimp = this.searchDiseaseField.trim();
      this.sendTerms = true;
      var params: any = {}
      params.uuid = this.myuuid;
      params.Term = tempModelTimp;
      params.Lang = sessionStorage.getItem('lang');
      params.Found = "No";
      if (this.listOfFilteredDiseases.length > 0) {
        params.Found = "Yes";
      }

      var d = new Date(Date.now());
      var a = d.toString();
      params.Date = a;
      this.subscription.add(this.http.post('https://prod-246.westeurope.logic.azure.com:443/workflows/5af138b9f41f400f89ecebc580d7668f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=PiYef1JHGPRDGhYWI0s1IS5a_9Dpz7HLjwfEN_M7TKY', params)
        .subscribe((res: any) => {
          console.log('feed');
        }, (err) => {
          console.log(err);
        }));
    }
  }

  showMoreInfoDiagnosePopup(index) {
    this.loadingOneDisease = true;
    this.selectedDiseaseIndex = index;
    this.actualInfoOneDisease = this.listOfFilteredDiseases[this.selectedDiseaseIndex];
    this.searchDiseaseField = '';
    this.listOfFilteredDiseases = [];
  }

  clearsearchDiseaseField() {
    this.searchDiseaseField = "";
    this.listOfFilteredDiseases = [];
    this.callListOfDiseases = false;
    this.actualInfoOneDisease = {};
  }

  selected($e) {
    $e.preventDefault();
    if (!$e.item.error) {
      this.actualInfoOneDisease = $e.item;
      console.log($e.item);
      //this.searchDiseaseField =$e.item
    }
  }

  searchDiseases2(text){
    var info = {
      "text": text,
      "lang": sessionStorage.getItem('lang')
    }
    this.subscription.add( this.apiDx29ServerService.searchDiseases(info)
    .subscribe( (res : any) => {
      console.log(res);
      this.actualInfoOneDisease = res[0];
    }, (err) => {
      console.log(err);
    }));

  }

  searchDiseases: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.callListOfDiseases = true),
      switchMap(term =>
        this.searchTermService.search(term).pipe(
          tap(() => this.nothingFoundDisease = false),
          catchError(() => {
            this.nothingFoundDisease = true;
            return of([]);
          }))
      ),
      tap(() => this.callListOfDiseases = false)
    )


    
  loadEnvir() {
    this.subscription.add(this.patientService.getPatientId()
      .subscribe((res0: any) => {
        this.loadData();
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));
  }

  loadSettings(){
    //cargar preferencias de la cuenta
    this.subscription.add( this.http.get(environment.api+'/api/users/settings/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      this.settings.lengthunit = res.user.lengthunit;
      this.settings.massunit = res.user.massunit;
     }, (err) => {
       console.log(err);
     }));
  }


  loadData(){
    //cargar los datos del usuario
    this.loadedWeight = false;
    this.loadedHeight = false;
    //cargar el weight del usuario
    this.subscription.add( this.patientService.getPatientWeight()
    .subscribe( (res : any) => {
      console.log(res);
      if(res.message=='There are no weight'){
        //no tiene weight
        if(this.editingWeightHistory){
          this.editingWeightHistory = false;
          this.actualWeight = {
            value: null,
            date: null,
            _id: null
          };
      
        }
      }else{
        this.actualWeight = res.weight;
        if(this.settings.massunit == 'lb'){
          this.actualWeight.value = this.actualWeight.value * 2.2046;
        }
        this.actualWeight.value= parseFloat(this.actualWeight.value).toFixed(1);
        //res.weights.data.sort(this.sortService.GetSortOrder("date"));// los ordeno por nombre?

        //cargar el histórico del peso
        this.subscription.add( this.http.get(environment.api+'/api/weights/'+this.authService.getCurrentPatient().sub)
        .subscribe( (resweight : any) => {
          console.log(resweight);
          if(resweight.message){
            //no tiene historico de peso
          }else{
           this.weightHistory = resweight;
            var datagraphweight =  [];
            for(var i = 0; i < resweight.length; i++) {
              //var splitDate = resweight[i].date.split('T');
              var splitDate = new Date(resweight[i].date);
              /*var splitDateString;
              switch(this.authService.getLang()){
                case 'en':
                  splitDateString=splitDate.toLocaleString('en-US').split(",")[0];
                case 'es':
                  splitDateString=splitDate.toLocaleString('es-ES').split(",")[0];
                case 'nl':
                  splitDateString=splitDate.toLocaleString('de-DE').split(",")[0];
                default:
                  splitDateString=splitDate.toLocaleString('en-US').split(",")[0];
              }*/
              //datagraphweight.push({value: resweight[i].value, name: splitDate[0]});
              if(this.settings.massunit == 'lb'){
                resweight[i].value = resweight[i].value * 2.2046;
              }
              resweight[i].value= parseFloat(resweight[i].value).toFixed(1);
              datagraphweight.push({value: resweight[i].value, name: splitDate});

            }

            this.lineChartWeight = [
              {
                "name": this.settings.massunit,
                "series": datagraphweight
              }
            ];

          }
         }, (err) => {
           console.log(err);
         }));


      }
      this.loadedWeight = true;
     }, (err) => {
       console.log(err);
       this.loadedWeight = true;
     }));

     //cargar el height del usuario
     this.subscription.add( this.patientService.getPatientHeight()
     .subscribe( (res : any) => {
       if(res.message=='There are no height'){
         //no tiene height
         if(this.editingHeightHistory){
          this.editingHeightHistory = false;
          
          this.actualHeight = {
            value: null,
            date: null,
            technique: null,
            _id: null
          };
        }
       }else{
         this.actualHeight = res.height;
         if(this.settings.lengthunit == 'ft'){
           this.actualHeight.value = this.actualHeight.value / 30.48;

           var foot = Math.floor(this.actualHeight.value);
           var inches = Math.floor((this.actualHeight.value - foot)*2.54);
           this.footHeight = {
             feet: foot,
             inches: inches
           };
         }
         this.actualHeight.value= parseFloat(this.actualHeight.value).toFixed(1);
         //res.heights.data.sort(this.sortService.GetSortOrder("date"));// los ordeno por nombre?

         //cargar el histórico de la altura
         this.subscription.add( this.http.get(environment.api+'/api/heights/'+this.authService.getCurrentPatient().sub)
         .subscribe( (resheight : any) => {
           if(resheight.message){
             //no tiene historico de peso
           }else{
           this.heightHistory = resheight;
             var datagraphheight =  [];
             for(var i = 0; i < resheight.length; i++) {
               //var splitDate = resheight[i].date.split('T');
               //datagraphheight.push({value: resheight[i].value, name: splitDate[0]});

               var splitDate = new Date(resheight[i].date);
                //datagraphweight.push({value: resweight[i].value, name: splitDate[0]});
                if(this.settings.lengthunit == 'ft'){
                  resheight[i].value = resheight[i].value / 30.48;
       
                  /*var foot = Math.floor(this.actualHeight.value);
                  var inches = Math.floor((this.actualHeight.value - foot)*2.54);
                  this.footHeight = {
                    feet: foot,
                    inches: inches
                  };*/
                  
                }
                resheight[i].value= parseFloat(resheight[i].value).toFixed(1);
                


                datagraphheight.push({value: resheight[i].value, name: splitDate});


             }

             this.lineChartHeight = [
               {
                 "name": this.settings.lengthunit,
                 "series": datagraphheight
               }
             ];

           }
          }, (err) => {
            console.log(err);
          }));

       }
       this.loadedHeight = true;
      }, (err) => {
        console.log(err);
        this.loadedHeight = true;
      }));
  }


  replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace);
  }

  //traducir cosas
  loadTranslations(){
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk=res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail=res;
    });

    this.translate.get('anthropometry.Weight').subscribe((res: string) => {
      this.transWeight=res;
    });
    this.translate.get('anthropometry.Height').subscribe((res: string) => {
      this.transHeight=res;
    });
    this.translate.get('generics.Date').subscribe((res: string) => {
      this.msgDate=res;
    });
  }

  openWeightHistory(customContent){
    this.modalReference = this.modalService.open(customContent);
  }
  openHeightHistory(customContent){
    this.modalReference = this.modalService.open(customContent);
  }


  setWeight(){
    this.selectedWeight = {
      value: '',
      date: this.dateService.transformDate(new Date()),
      _id: null
    };

    this.settingWeight = true;
  }

  updateWeight(){
    this.actualWeight.date=this.dateService.transformDate(this.actualWeight.date);
    this.selectedWeight = this.actualWeight;

    this.settingWeight = true;
  }

  resetFormWeight(){
    this.selectedWeight = {
      value: '',
      date: this.dateService.transformDate(new Date()),
      _id: null
    };

    this.settingWeight = false;
  }

  submitInvalidFormWeight() {
    if (!this.weightForm) { return; }
    const base = this.weightForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmitWeight() {

    if(this.authGuard.testtoken()){
      this.sending = true;
      this.selectedWeight.value = this.selectedWeight.value.replace(',', '.');
      var parseMassunit = this.selectedWeight;
      if(this.settings.massunit == 'lb'){
        parseMassunit.value = parseMassunit.value / 2.2046;
      }
      //this.seizuresForm.value.start = this.dateService.transformDate(this.seizuresForm.value.start);
      this.subscription.add( this.http.post(environment.api+'/api/weight/'+this.authService.getCurrentPatient().sub, parseMassunit)
        .subscribe( (res : any) => {
          if(res.message == 'weight exists'){
            Swal.fire(this.translate.instant("generics.Warning"), 'weight exists', "error");
         }else{
           this.toastr.success('', this.msgDataSavedOk);
         }
          this.selectedWeight = {};
          this.selectedWeight = res.weight;
          if(this.settings.massunit == 'lb'){
            this.selectedWeight.value = this.selectedWeight.value * 2.2046;
          }
          this.actualWeight = this.selectedWeight;
          this.sending = false;
          this.settingWeight = false;
          this.loadData();
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
    }
  }

  setHeight(){
    this.selectedHeight = {
      value: '',
      date: this.dateService.transformDate(new Date()),
      technique: null,
      _id: null
    };

    this.settingHeight = true;
  }

  updateHeight(){
    this.actualHeight.date=this.dateService.transformDate(this.actualHeight.date);
    this.selectedHeight = this.actualHeight;

    this.settingHeight = true;
  }

  resetFormHeight(){
    this.selectedHeight = {
      value: '',
      date: this.dateService.transformDate(new Date()),
      technique: null,
      _id: null
    };

    this.settingHeight = false;
  }

  submitInvalidFormHeight() {
    if (!this.heightForm) { return; }
    const base = this.heightForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmitHeight() {

    if(this.authGuard.testtoken()){
      this.sending = true;
      this.selectedHeight.value = this.selectedHeight.value.replace(',', '.');
      var parseLengthUnit = this.selectedHeight;

      this.footHeight

      if(this.settings.lengthunit == 'ft'){

        parseLengthUnit.value = (this.footHeight.feet * 30.48) + (this.footHeight.inches*2.54);
      }

      this.subscription.add( this.http.post(environment.api+'/api/height/'+this.authService.getCurrentPatient().sub, parseLengthUnit)
        .subscribe( (res : any) => {
          if(res.message == 'height exists'){
            Swal.fire(this.translate.instant("generics.Warning"), 'height exists', "error");
         }else{
           this.toastr.success('', this.msgDataSavedOk);
         }
          this.selectedHeight = {};
          this.selectedHeight = res.height;
          if(this.settings.lengthunit == 'ft'){
            this.selectedHeight.value = this.selectedHeight.value / 30.48;
          }
          this.actualHeight = this.selectedHeight;
          this.sending = false;
          this.settingHeight = false;
          this.loadData();
         }, (err) => {
           console.log(err);
           this.sending = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             this.toastr.error('', this.msgDataSavedFail);
           }
         }));
    }
  }

  editWeightHistory(){
    this.modalReference.close();
    this.editingWeightHistory = true;
  }

  confirmDeleteWeight(index){
    var dateWeight=this.dateService.transformDate(this.weightHistory[index].date);
    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ dateWeight+' <br> ('+this.weightHistory[index].value+')',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.deleteWeight( this.weightHistory[index]._id);
        //this.weightHistory.splice(index, 1);

      }
    });
  }

  deleteWeight(id){
    if(this.authGuard.testtoken()){
      this.subscription.add( this.http.delete(environment.api+'/api/weight/'+id)
      .subscribe( (res : any) => {
        if(res.message=="The weight has been eliminated"){
          //Swal.fire('', this.translate.instant("lang.Language deleted"), "success");
          this.loadData();
        }


       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"));
         }
       }));
     }
  }

  editHeightHistory(){
    this.modalReference.close();
    this.editingHeightHistory = true;
  }

  confirmDeleteHeight(index){
    var dateHeight=this.dateService.transformDate(this.heightHistory[index].date);
    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ dateHeight+' <br> ('+this.heightHistory[index].value+')',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0CC27E',
        cancelButtonColor: '#FF586B',
        confirmButtonText: this.translate.instant("generics.Delete"),
        cancelButtonText: this.translate.instant("generics.No, cancel"),
        showLoaderOnConfirm: true,
        allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.deleteHeight( this.heightHistory[index]._id);
        //this.heightHistory.splice(index, 1);

      }
    });
  }

  deleteHeight(id){
    if(this.authGuard.testtoken()){
      this.subscription.add( this.http.delete(environment.api+'/api/height/'+id)
      .subscribe( (res : any) => {
        if(res.message=="The height has been eliminated"){
          //Swal.fire('', this.translate.instant("lang.Language deleted"), "success");
          this.loadData();
        }


       }, (err) => {
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           this.toastr.error('', this.translate.instant("generics.Data saved fail"));
         }
       }));
     }
  }

  back(){
    this.editingHeightHistory = false;
    this.editingWeightHistory = false;
  }
  tickFormatting(d: any) {
    return d.toLocaleString('es-ES').split(" ")[0];

  }

  changePickupMarkerLocation($event: { coords:any}) {
    this.datainfo.lat=$event.coords.lat;
    this.datainfo.lng=$event.coords.lng;
    this.showMarker=true;
    }

}
