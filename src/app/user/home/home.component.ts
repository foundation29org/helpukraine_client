import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { PatientService } from 'app/shared/services/patient.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { ApiExternalServices } from 'app/shared/services/api-external.service';
import { ToastrService } from 'ngx-toastr';
import { SearchService } from 'app/shared/services/search.service';
import { SortService } from 'app/shared/services/sort.service';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { Apif29NcrService } from 'app/shared/services/api-f29ncr.service';
import { DateService } from 'app/shared/services/date.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { Subscription } from 'rxjs/Subscription';
import Swal from 'sweetalert2';
import * as chartsData from 'app/shared/configs/general-charts.config';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [PatientService, Apif29BioService, ApiDx29ServerService, Apif29NcrService, ApiExternalServices]
})

export class HomeComponent implements OnInit, OnDestroy {
  //Variable Declaration
  patient: any;
  selectedHeight: any;
  actualHeight: any;
  settingHeight: boolean = false;
  footHeight: any;

  //Chart Data
  lineChartSeizures = [];
  lineChartHeight = [];
  lineChartDrugs = [];
  lineChartDrugsCopy = [];
  lineDrugsVsSeizures = [];
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
  lineChartOneColorScheme = chartsData.lineChartOneColorScheme;

  // line, area
  lineChartAutoScale = chartsData.lineChartAutoScale;
  lineChartLineInterpolation = chartsData.lineChartLineInterpolation;


  //Bar Charts
  barChartView: any[] = chartsData.barChartView;

  // options
  barChartShowYAxis = chartsData.barChartShowYAxis;
  barChartShowXAxis = chartsData.barChartShowXAxis;
  barChartGradient = chartsData.barChartGradient;
  barChartShowLegend = chartsData.barChartShowLegend;
  barChartShowXAxisLabel = chartsData.barChartShowXAxisLabel;
  barChartXAxisLabel = chartsData.barChartXAxisLabel;
  barChartShowYAxisLabel = chartsData.barChartShowYAxisLabel;
  barChartYAxisLabel = chartsData.barChartYAxisLabel;
  barChartColorScheme = chartsData.barChartColorScheme;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private transWeight: string;
  private transHeight: string;
  private msgDate: string;
  private titleSeizures: string;
  private titleDose: string;
  private titleDrugsVsNormalized: string;
  titleDrugsVsDrugs: string;
  private titleDrugsVsNoNormalized: string;
  private group: string;
  actualMedications: any;
  loadedFeels: boolean = false;
  loadedEvents: boolean = false;
  loadedDrugs: boolean = false;
  loadingDataGroup: boolean = false;
  dataGroup: any;
  drugsLang: any;
  feels: any = [];
  events: any = [];
  medications: any = [];
  timeformat = "";
  lang = 'en';
  formatDate: any = [];
  today = new Date();

  userId: string = '';
  loadedPatientId: boolean = false;
  selectedPatient: any = {};
  userInfo: any = {};
  loadedInfoPatient: boolean = false;
  basicInfoPatient: any;
  basicInfoPatientCopy: any;
  age: number = null;
  weight: string;
  groups: Array<any> = [];
  step: string = '1';
  private subscription: Subscription = new Subscription();
  rangeDate: string = 'month';
  normalized: boolean = true;
  normalized2: boolean = true;
  maxValue: number = 0;
  maxValueDrugsVsSeizu: number = 0;
  minDate = new Date();
  minDateRange = new Date();
  drugsBefore: boolean = false;
  yAxisTicksSeizures = [];
  yAxisTicksDrugs = [];

  pendingsTaks: number = 8;
  totalTaks: number = 0;
  tasksLoaded: boolean = false;


  //lastchart
  showXAxis = false;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  legendTitle = 'Legend';
  legendPosition = 'right';
  showXAxisLabel = false;
  xAxisLabel = 'Country';
  showYAxisLabel = true;
  yAxisLabel = 'Seizures';
  showGridLines = true;
  animations: boolean = true;
  barChart: any[] = barChart;
  lineChartSeries: any[] = lineChartSeries;
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b', '#7aa3e5', '#a8385d', '#00bfa5']
  };

  comboBarScheme = {
    name: 'singleLightBlue',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };

  showRightYAxisLabel: boolean = true;
  yAxisLabelRight: string;
  valueprogressbar = 0;
  consentgroup: boolean = false;
  recommendedDoses: any = [];
  showNotiSeizu: boolean = false;
  showNotiFeel: boolean = false;
  showNotiDrugs: boolean = false;

  countries: any = [];
  actualLocation: any = {};
  @ViewChild('f') personalInfoForm: NgForm;
  sending: boolean = false;
  saving: boolean = false;

  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 4;
  showMarker: boolean = false;
  resTextAnalyticsSegments:any;
  newDrugs: any = [];
  callingTextAnalytics: boolean = false;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private patientService: PatientService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private dateService: DateService, private apiDx29ServerService: ApiDx29ServerService, private sortService: SortService, private adapter: DateAdapter<any>, private searchService: SearchService, private router: Router, private apiExternalServices: ApiExternalServices, private apif29BioService: Apif29BioService) {
    this.adapter.setLocale(this.authService.getLang());
    this.lang = this.authService.getLang();
    switch (this.authService.getLang()) {
      case 'en':
        this.timeformat = "M/d/yy";
        break;
      case 'es':
        this.timeformat = "d/M/yy";
        break;
      case 'nl':
        this.timeformat = "d-M-yy";
        break;
      default:
        this.timeformat = "M/d/yy";
        break;

    }
  }


  loadGroups() {
    this.subscription.add(this.apiDx29ServerService.loadGroups()
      .subscribe((res: any) => {
        this.groups = res;
        this.groups.sort(this.sortService.GetSortOrder("order"));
      }, (err) => {
        console.log(err);
      }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  ngOnInit() {
    this.getUserInfo();
    this.initEnvironment();
  }

  getConsentGroup() {
    this.subscription.add(this.http.get(environment.api + '/api/patient/consentgroup/' + this.authService.getCurrentPatient().sub)
      .subscribe((res: any) => {
        console.log(res);
        this.consentgroup = res.consentgroup;
      }, (err) => {
        console.log(err.error);
      }));
  }

  loadEnvironment() {
    this.medications = [];
    this.actualMedications = [];
    this.group = this.authService.getGroup();
    this.patient = {
    };

    this.selectedHeight = {
      value: null,
      dateTime: null,
      technique: null,
      _id: null
    };

    this.footHeight = {
      feet: null,
      inches: null
    };

    this.actualHeight = {
      value: null,
      dateTime: null,
      technique: null,
      _id: null
    };

    this.loadTranslations();
    this.adapter.setLocale(this.authService.getLang());
    switch (this.authService.getLang()) {
      case 'en':
        this.timeformat = "M/d/yy";
        break;
      case 'es':
        this.timeformat = "d/M/yy";
        break;
      case 'nl':
        this.timeformat = "d-M-yy";
        break;
      default:
        this.timeformat = "M/d/yy";
        break;

    }

    this.loadTranslationsElements();
    this.loadGroups();
    this.getInfoPatient();
    this.getConsentGroup();
  }


  yAxisTickFormatting(value) {
    return this.percentTickFormatting(value);
  }

  percentTickFormatting(val: any) {
    return Math.round(val);
  }

  axisFormat(val) {
    if (Number.isInteger(val)) {
      return Math.round(val);
    } else {
      return '';
    }

  }

  //traducir cosas
  loadTranslations() {
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk = res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail = res;
    });

    this.translate.get('anthropometry.Weight').subscribe((res: string) => {
      this.transWeight = res;
    });
    this.translate.get('menu.Feel').subscribe((res: string) => {
      this.transHeight = res;
    });
    this.translate.get('generics.Date').subscribe((res: string) => {
      this.msgDate = res;
    });

    this.translate.get('menu.Seizures').subscribe((res: string) => {
      this.titleSeizures = res;
    });
    this.translate.get('medication.Dose mg').subscribe((res: string) => {
      this.yAxisLabelRight = res;
    });
    this.translate.get('homeraito.Normalized').subscribe((res: string) => {
      this.titleDrugsVsNormalized = res;
      this.titleDose = res;
      this.titleDrugsVsDrugs = this.titleDrugsVsNormalized;
    });
    this.translate.get('homeraito.Not normalized').subscribe((res: string) => {
      this.titleDrugsVsNoNormalized = res;
    });
  }

  loadTranslationsElements() {
    if (this.authService.getGroup() != null) {
      this.loadingDataGroup = true;
      this.subscription.add(this.http.get(environment.api + '/api/group/medications/' + this.authService.getGroup())
        .subscribe((res: any) => {
          if (res.medications.data.length == 0) {
            //no tiene datos sobre el grupo
          } else {
            this.dataGroup = res.medications.data;
            this.drugsLang = [];
            if (this.dataGroup.drugs.length > 0) {
              for (var i = 0; i < this.dataGroup.drugs.length; i++) {
                var found = false;
                for (var j = 0; j < this.dataGroup.drugs[i].translations.length && !found; j++) {
                  if (this.dataGroup.drugs[i].translations[j].code == this.authService.getLang()) {
                    if (this.dataGroup.drugs[i].drugsSideEffects != undefined) {
                      this.drugsLang.push({ name: this.dataGroup.drugs[i].name, translation: this.dataGroup.drugs[i].translations[j].name, drugsSideEffects: this.dataGroup.drugs[i].drugsSideEffects });
                    } else {
                      this.drugsLang.push({ name: this.dataGroup.drugs[i].name, translation: this.dataGroup.drugs[i].translations[j].name });
                    }
                    found = true;
                  }
                }
              }
              this.drugsLang.sort(this.sortService.GetSortOrder("translation"));
            }
          }
          this.loadingDataGroup = false;
          this.loadData();
        }, (err) => {
          console.log(err);
          this.loadingDataGroup = false;
          this.loadData();
        }));
    } else {
      this.loadingDataGroup = false;
      this.loadData();
    }
  }

  initEnvironment() {
    //this.userId = this.authService.getIdUser();
    if (this.authService.getCurrentPatient() == null) {
      this.loadPatientId();
    } else {
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.loadEnvironment();
    }
  }


  loadPatientId() {
    this.loadedPatientId = false;
    this.subscription.add(this.patientService.getPatientId()
      .subscribe((res: any) => {
        if (res == null) {
          this.authService.logout();
        } else {
          this.loadedPatientId = true;
          this.authService.setCurrentPatient(res);
          this.selectedPatient = res;
          this.loadEnvironment();
        }
      }, (err) => {
        console.log(err);
      }));
  }

  getUserInfo() {
    this.subscription.add(this.http.get(environment.api + '/api/users/name/' + this.authService.getIdUser())
      .subscribe((res: any) => {
        this.userInfo = res;
      }, (err) => {
        console.log(err);
      }));

  }

  getInfoPatient() {
    this.loadedInfoPatient = false;
    this.subscription.add(this.http.get(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub)
      .subscribe((res: any) => {
        console.log(res);
        this.basicInfoPatient = res.patient;
        //this.basicInfoPatient.birthDate = this.dateService.transformDate(res.patient.birthDate);
        this.basicInfoPatientCopy = JSON.parse(JSON.stringify(res.patient));
        this.loadedInfoPatient = true;
      }, (err) => {
        console.log(err);
        this.loadedInfoPatient = true;
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));
  }

  ageFromDateOfBirthday(dateOfBirth: any) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }

  question1() {

    this.step = '1';
    this.loadGroups();
  }

  question2() {
    console.log(this.basicInfoPatient.group);
    if (this.basicInfoPatient.group == '61bb40e8d6e0cb14f08881c2' || this.basicInfoPatient.group == '61bb390ed6e0cb14f08881c1') {
      this.step = '4';
    } else {
      this.step = '2';
    }
  }

  question3(response) {
    this.basicInfoPatient.consentgroup = response;
    console.log(this.basicInfoPatient.consentgroup);
    this.step = '3';
    console.log(this.basicInfoPatient.lat);
    if(this.basicInfoPatient.lat==""){
      this.getLocationInfo();
    }
    
    //this.setPatientGroup(this.basicInfoPatient.group);
  }

  setNeeds() {
    this.callTextAnalitycs();
    this.basicInfoPatient.group = this.group;
    this.setPatientGroup(this.basicInfoPatient.group);
  }

  setNeeds2() {
    this.callTextAnalitycs();
    this.setPatientGroup(this.basicInfoPatient.group);
  }

  detectLang() {
    var testLangText = this.basicInfoPatient.needs.substr(0, 4000)
    this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
      .subscribe((res: any) => {
        /*this.langToExtract = res[0].language;
        this.onSubmitToExtractor();*/
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
      }));
  }

  /*callTextAnalitycs2() {
    this.callingTextAnalytics = true;
    var jsontestLangText = { "text": this.basicInfoPatient.needs };
    this.subscription.add(this.apif29BioService.callTextAnalytics(jsontestLangText)
      .subscribe((res: any) => {
        console.log(res);
        this.newDrugs = [];
        this.resTextAnalyticsSegments = res[1].segments;
        for (let i = 0; i < this.resTextAnalyticsSegments.length; i++) {
          for (let j = 0; j < this.resTextAnalyticsSegments[i].annotations.length; j++) {
            var actualDrug = { name: '', dose: '', link: '' };
            if (this.resTextAnalyticsSegments[i].annotations[j].category == 'MedicationName') {
              actualDrug.name = this.resTextAnalyticsSegments[i].annotations[j].text;
              if (this.resTextAnalyticsSegments[i].annotations[j + 2] != undefined) {
                if (this.resTextAnalyticsSegments[i].annotations[j + 2].category == 'Dosage') {
                  actualDrug.dose = this.resTextAnalyticsSegments[i].annotations[j + 2].text;
                }
              }
              if (this.resTextAnalyticsSegments[i].annotations[j].links != null) {
                var found = false;
                for (let k = 0; k < this.resTextAnalyticsSegments[i].annotations[j].links.length && !found; k++) {
                  if (this.resTextAnalyticsSegments[i].annotations[j].links[k].dataSource == 'ATC') {
                    actualDrug.link = this.resTextAnalyticsSegments[i].annotations[j].links[k].id;
                    found = true;
                  }
                }
              }
              this.newDrugs.push(actualDrug);
            }
          }
        }
        console.log(this.newDrugs);
        this.callingTextAnalytics = false;
        this.saveDrugs();

      }, (err) => {
        console.log(err);
        this.callingTextAnalytics = false;
      }));
  }*/

  callTextAnalitycs() {
    this.callingTextAnalytics = true;
    var info = this.basicInfoPatient.needs.replace(/\n/g, " ");
    var jsontestLangText = { "text": info };
    this.subscription.add(this.apif29BioService.callTextAnalytics(jsontestLangText)
      .subscribe((res: any) => {
        this.newDrugs = [];
        this.resTextAnalyticsSegments = res;
          for (let j = 0; j < this.resTextAnalyticsSegments.entities.length; j++) {
            var actualDrug = { name: '', dose: '', link: '' };
            if (this.resTextAnalyticsSegments.entities[j].category == 'MedicationName') {
              actualDrug.name = this.resTextAnalyticsSegments.entities[j].text;
              
              if (this.resTextAnalyticsSegments.entities[j].dataSources != null) {
                var found = false;
                for (let k = 0; k < this.resTextAnalyticsSegments.entities[j].dataSources.length && !found; k++) {
                  if (this.resTextAnalyticsSegments.entities[j].dataSources[k].name == 'ATC') {
                    actualDrug.link = this.resTextAnalyticsSegments.entities[j].dataSources[k].entityId;
                    found = true;
                  }
                }
              }
              if (this.resTextAnalyticsSegments.entityRelations != null) {
                var found = false;
                for (let k = 0; k < this.resTextAnalyticsSegments.entityRelations.length && !found; k++) {
                  if(this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='MedicationName' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='Dosage'){
                    actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text;
                  }
                  if(this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.text==actualDrug.name && this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.category=='Dosage' && this.resTextAnalyticsSegments.entityRelations[k].roles[1].entity.category=='MedicationName'){
                    actualDrug.dose = this.resTextAnalyticsSegments.entityRelations[k].roles[0].entity.text;
                  }
                }

              }
              this.newDrugs.push(actualDrug);
            }
          }
        console.log(this.newDrugs);
        this.callingTextAnalytics = false;
        this.saveDrugs();

      }, (err) => {
        console.log(err);
        this.callingTextAnalytics = false;
      }));
  }

  saveDrugs(){
      var paramssend = { drugs: this.newDrugs };
      this.subscription.add( this.http.put(environment.api+'/api/patient/drugs/'+this.authService.getCurrentPatient().sub, paramssend)
      .subscribe( (res : any) => {
        this.basicInfoPatient.drugs = this.newDrugs;
        console.log(res);
      }, (err) => {
        console.log(err.error);
      }));
  }

  getLocationInfo(){
    this.subscription.add(this.apiExternalServices.getInfoLocation()
        .subscribe((res: any) => {
          console.log(res);
            this.actualLocation = res;
            var param = this.actualLocation.loc.split(',');
            if(param[1]){
              this.basicInfoPatient.lat = Number(param[0]);
              this.basicInfoPatient.lng = Number(param[1]);
              this.showMarker = true;
            }
            
        }, (err) => {
            console.log(err);
        }));
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }


  submitInvalidForm() {
    if (!this.personalInfoForm) { return; }
    const base = this.personalInfoForm;
    for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
      }
    }
  }

  onSubmit() {
    console.log('eop');
    if (this.personalInfoForm.value.role == 'User' && (this.personalInfoForm.value.subrole == 'null' || this.personalInfoForm.value.subrole == null)) {
      Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("registration.select the type of patient1"), "warning");
    } else {
      this.sending = true;
      var params = this.personalInfoForm.value;
      params.permissions = {};
      params.gender = this.basicInfoPatient.gender;

      if (this.basicInfoPatient.birthDate != null) {
        console.log(this.basicInfoPatient.birthDate);
        //this.basicInfoPatient.birthDate = this.dateService.transformDate(this.basicInfoPatient.birthDate);
      }
      console.log(this.basicInfoPatient);
      this.subscription.add(this.http.put(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub, this.basicInfoPatient)
        .subscribe((res: any) => {
          this.sending = false;
          this.goStep('5');
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));
    }


  }

  setPatientGroup(group) {
    this.saving = true;
    this.basicInfoPatient.group = group;
    this.subscription.add(this.http.put(environment.api + '/api/patients/' + this.authService.getCurrentPatient().sub, this.basicInfoPatient)
      .subscribe((res: any) => {
        this.authService.setGroup(this.basicInfoPatient.group);
        this.saving = false;
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
      }, (err) => {
        console.log(err);
        this.saving = false;
      }));
  }

  goStep(index) {
    this.step = index;
  }

  loadData() {
    //cargar los datos del usuario
    this.loadedFeels = false;
    //this.getDrugs();
  }


  getDrugs() {
    this.lineChartDrugs = [];
    this.lineChartDrugsCopy = [];
    this.maxValue = 0;
    this.medications = [];
    var info = { rangeDate: this.rangeDate }
    this.subscription.add(this.http.post(environment.api + '/api/medications/dates/' + this.authService.getCurrentPatient().sub, info)
      .subscribe((res: any) => {

        this.medications = res;
        console.log(res);
        if (this.medications.length > 0) {
          res.sort(this.sortService.DateSortInver("date"));
          this.searchTranslationDrugs();
          this.groupMedications();
        } else {
          this.showNotiDrugs = false;
        }
        this.loadedDrugs = true;
      }, (err) => {
        console.log(err);
        this.loadedDrugs = true;
      }));

  }


  searchTranslationDrugs() {
    for (var i = 0; i < this.medications.length; i++) {
      var foundTranslation = false;
      for (var j = 0; j < this.drugsLang.length && !foundTranslation; j++) {
        if (this.drugsLang[j].name == this.medications[i].drug) {
          for (var k = 0; k < this.drugsLang[j].translation.length && !foundTranslation; k++) {
            this.medications[i].drugTranslate = this.drugsLang[j].translation;
            foundTranslation = true;
          }
        }
      }
    }
  }

  groupMedications() {
    this.actualMedications = [];
    for (var i = 0; i < this.medications.length; i++) {
      if (!this.medications[i].endDate) {
        this.actualMedications.push(this.medications[i]);
      } else {
        var medicationFound = false;
        if (this.actualMedications.length > 0) {
          for (var j = 0; j < this.actualMedications.length && !medicationFound; j++) {
            if (this.medications[i].drug == this.actualMedications[j].drug) {
              medicationFound = true;
            }
          }
        }

      }
    }
  }



  onSelect(event) {
    //your code here
  }

  changePickupMarkerLocation($event: { coords: any }) {
    this.basicInfoPatient.lat = $event.coords.lat;
    this.basicInfoPatient.lng = $event.coords.lng;
    this.showMarker = true;
  }

  changedCaretaker(event) {
    this.userInfo.iscaregiver = event.value;
    this.setCaretaker();
  }

  setCaretaker(){
    var data = {iscaregiver: this.userInfo.iscaregiver};
    this.subscription.add( this.http.put(environment.api+'/api/users/changeiscaregiver/'+this.authService.getIdUser(), data)
    .subscribe( (res : any) => {
      console.log(res);
      //this.getUsers();
     }, (err) => {
       console.log(err);
     }));
    //this.user = user;
  }

  confirmDeleteDrug(index){
    Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete")+': '+ this.basicInfoPatient.drugs[index].name,
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
        this.basicInfoPatient.drugs.splice(index, 1);
        this.newDrugs = this.basicInfoPatient.drugs;
        this.saveDrugs();
      }
    });
  }

}

export let lineChartSeries = [
];

export let barChart: any = [
];