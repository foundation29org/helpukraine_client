import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { ToastrService } from 'ngx-toastr';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { PatientService } from 'app/shared/services/patient.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import Swal from 'sweetalert2';
import * as chartsData from 'app/shared/configs/general-charts.config';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {DateAdapter} from '@angular/material/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-anthropometry',
    templateUrl: './anthropometry.component.html',
    styleUrls: ['./anthropometry.component.scss'],
    providers: [PatientService]
})


export class AnthropometryComponent implements OnInit, OnDestroy{
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

  sending: boolean = false;
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
  private subscription: Subscription = new Subscription();
  timeformat="";
  lang='en';

  constructor(private router: Router, private http: HttpClient, private authService: AuthService, private dateService: DateService, public toastr: ToastrService, public searchFilterPipe: SearchFilterPipe, public translate: TranslateService, private authGuard: AuthGuard, private modalService: NgbModal, private adapter: DateAdapter<any>, private patientService: PatientService) {
    this.adapter.setLocale(this.authService.getLang());
    this.lang =this.authService.getLang();
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
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {

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
     this.adapter.setLocale(this.authService.getLang());
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
  }



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


}
