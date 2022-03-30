import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { RequestCliService } from 'app/shared/services/request-cli.service';
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
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import Swal from 'sweetalert2';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [RequestCliService, Apif29BioService, ApiDx29ServerService, Apif29NcrService, ApiExternalServices]
})

export class HomeComponent implements OnInit, OnDestroy {
  //Variable Declaration
  patient: any;

  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  private group: string;
  loadingDataGroup: boolean = false;
  dataGroup: any;
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

  consentgroup: boolean = false;

  actualLocation: any = {};
  @ViewChild('f') personalInfoForm: NgForm;
  sending: boolean = false;
  saving: boolean = false;

  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 4;
  showMarker: boolean = false;
  resTextAnalyticsSegments: any;
  newDrugs: any = [];
  newDrug: any = {};
  callingTextAnalytics: boolean = false;

  requests: any = [];
  loadedRequest: boolean = false;
  showPanelEdit: boolean = false;
  actualRequest: any = {};
  requestIndex = -1;
  modalReference: NgbModalRef;
  editingDrugIndex: number = -1;
  checks: any = {};
  tasksLoaded: boolean = false;
  isWizard: boolean = false;
  groupName = '';

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private requestCliService: RequestCliService, public searchFilterPipe: SearchFilterPipe, public toastr: ToastrService, private dateService: DateService, private apiDx29ServerService: ApiDx29ServerService, private sortService: SortService, private adapter: DateAdapter<any>, private searchService: SearchService, private router: Router, private apiExternalServices: ApiExternalServices, private apif29BioService: Apif29BioService, private modalService: NgbModal) {
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
        //show patients with epilepsy and diabetes and None
        for (let i = 0; i < res.length; i++) {
          if (res[i].name == 'Patients with epilepsy' || res[i].name == 'Diabetes' || res[i].name == 'None') {
            this.groups.push(res[i]);
          }
        }
        //this.groups = res;
        this.groups.sort(this.sortService.GetSortOrder("order"));
      }, (err) => {
        console.log(err);
      }));
  }

  getGroupName(){
    //find the group name from the group id
    if(this.requests.length > 0){
      for(let i = 0; i < this.groups.length; i++){
        if(this.requests[0].group == this.groups[i]._id){
          this.groupName = this.groups[i].name;
        }
      }
    }
    
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  ngOnInit() {
    this.getUserInfo();
    this.initEnvironment();
    this.getRequestCli();
  }

  getRequestCli() {
    this.loadedRequest = false;
    this.subscription.add(this.requestCliService.getRequests()
      .subscribe((res: any) => {
        console.log(res);
        this.requests = res;
        if(this.requests.length == 0){
          this.newRequest()
          this.showPanelEdit = true;
        }else{
          this.showPanelEdit = false;
          this.requests.sort(this.sortService.DateSort("creationDate"));
          for (let i = 0; i < this.requests.length; i++) {
            this.requests[i].lat = parseFloat(this.requests[i].lat)
            this.requests[i].lng = parseFloat(this.requests[i].lng)
  
          }
          this.getChecks();
          this.getGroupName();
        }
        
        
        this.loadedRequest = true;
        
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
        this.showPanelEdit = false;
      }));
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
    this.group = this.authService.getGroup();
    this.patient = {
    };
    this.loadTranslations();
    this.loadGroups();
    //this.getConsentGroup();
  }


  //traducir cosas
  loadTranslations() {
    this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
      this.msgDataSavedOk = res;
    });
    this.translate.get('generics.Data saved fail').subscribe((res: string) => {
      this.msgDataSavedFail = res;
    });
  }

  initEnvironment() {
    //this.userId = this.authService.getIdUser();
    this.loadEnvironment();
  }


  getUserInfo() {
    this.subscription.add(this.http.get(environment.api + '/api/users/name/' + this.authService.getIdUser())
      .subscribe((res: any) => {
        this.userInfo = res;
        if (this.userInfo.lat == "") {
          this.getLocationInfo();
        }
      }, (err) => {
        console.log(err);
      }));

  }

  question0() {
    this.step = '2';
  }

  question1() {
    this.step = '3';
  }

  question2() {
    this.step = '4';
  }

  getLocationInfo() {
    this.subscription.add(this.apiExternalServices.getInfoLocation()
      .subscribe((res: any) => {
        console.log(res);
        this.actualLocation = res;
        var param = this.actualLocation.loc.split(',');
        if (param[1]) {
          this.userInfo.lat = Number(param[0]);
          this.userInfo.lng = Number(param[1]);
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

  onSelect(event) {
    //your code here
  }

  changePickupMarkerLocation($event: { coords: any }, index) {
    this.requests[index].lat = $event.coords.lat;
    this.requests[index].lng = $event.coords.lng;
    this.showMarker = true;
  }

  changePickupMarkerLocation2($event: { coords: any }) {
    this.actualRequest.lat = $event.coords.lat;
    this.actualRequest.lng = $event.coords.lng;
    this.showMarker = true;
  }

  changedCaretaker(event) {
    this.userInfo.iscaregiver = event.value;
    this.setCaretaker();
  }

  setCaretaker() {
    var data = { iscaregiver: this.userInfo.iscaregiver };
    this.subscription.add(this.http.put(environment.api + '/api/users/changeiscaregiver/' + this.authService.getIdUser(), data)
      .subscribe((res: any) => {
        console.log(res);
        //this.getUsers();
      }, (err) => {
        console.log(err);
      }));
    //this.user = user;
  }

  confirmDeleteDrug(index, isWizard) {
    if(isWizard){
      Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete") + ': ' + this.actualRequest.drugs[index].name,
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
          this.actualRequest.drugs.splice(index, 1);
          this.newDrugs = this.actualRequest.drugs;
        }
      });
    }else{
      Swal.fire({
        title: this.translate.instant("generics.Are you sure?"),
        html: this.translate.instant("generics.Delete") + ': ' + this.requests[0].drugs[index].name,
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
          this.requests[0].drugs.splice(index, 1);
          this.newDrugs = this.requests[0].drugs;
        }
      });
    }
    
  }

  newRequest(){
    this.initRequest();
    this.showPanelEdit = true;
    this.lat = parseFloat(this.userInfo.lat)
    this.lng = parseFloat(this.userInfo.lng)
  }

  initRequest(){
    this.actualRequest={
      lat: parseFloat(this.userInfo.lat),
      lng: parseFloat(this.userInfo.lng),
      notes: '',
      needs: '',
      needsOther: '',
      status: null,
      updateDate: Date.now(),
      group: null,
      othergroup: null,
      drugs: [],
      _id: null
    }
  }

  setRequest(){
    this.saving = true;
    console.log(this.actualRequest);
    this.updateRequest(this.actualRequest,0);
  }

  updateRequest(request, index){
    this.requestIndex = index;
    this.saving = true;
    console.log(request);
    this.changeRequest(request)
  }

  changeRequest(info){
    if(this.modalReference != undefined){
      this.modalReference.close()
    }
    if(info._id!=null){
      this.subscription.add(this.requestCliService.updateRequest(info._id, info)
      .subscribe((res: any) => {
        this.saving = false;
        console.log(res);
        this.setUserPosition(info.lat, info.lng)
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
    }else{
      this.subscription.add(this.requestCliService.saveRequest(info)
      .subscribe((res: any) => {
        this.saving = false;
        console.log(res);
        this.setUserPosition(info.lat, info.lng)
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
    }

  }

  setUserPosition(lat, lng){
    this.lat = parseFloat(lat)
    this.lng = parseFloat(lng)
    this.userInfo.lat = parseFloat(lat)
    this.userInfo.lng = parseFloat(lng)
    this.subscription.add(this.requestCliService.setPosition(this.userInfo.lat, this.userInfo.lng)
      .subscribe((res: any) => {
        console.log(res);
      }, (err) => {
        console.log(err);
      }));
  }

  confirmDeleteRequest(index) {
    Swal.fire({
      title: this.translate.instant("generics.Are you sure?"),
      html: this.translate.instant("generics.Delete"),
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
        var _id = this.requests[index]._id;
        this.requests.splice(index, 1);
        this.deleteRequest(_id);
      }
    });
  }

  deleteRequest(_id){
    this.subscription.add(this.requestCliService.deleteRequest(_id)
      .subscribe((res: any) => {
        console.log(res);
        this.getRequestCli();
      }, (err) => {
        console.log(err);
        this.loadedRequest = true;
      }));
  }

  addDrug(InfoDrug, isWizard){
    this.isWizard = isWizard;
    this.editingDrugIndex = -1;
    this.newDrug = {name: '', dose: '', link: '', strength: ''};
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  editDrug(index, InfoDrug, isWizard){
    this.isWizard = isWizard;
    console.log(index);
    this.editingDrugIndex = index;
    if(isWizard){
      this.newDrug = this.actualRequest.drugs[index];
    }else{
      this.newDrug = this.requests[0].drugs[index];
    }
    
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      backdrop : 'static',
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoDrug, ngbModalOptions);
  }

  saveNewDrug(){
    this.detectLang2(this.newDrug);
  }

  closePanel(){
    //this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }

  detectLang2(drug) {
    var testLangText = drug.name.substr(0, 4000)
    if(testLangText.length>0){
      this.subscription.add(this.apiDx29ServerService.getDetectLanguage(testLangText)
      .subscribe((res: any) => {
        if(res[0].language!='en'){
          var info = [{"Text":drug.name}]
          this.subscription.add(this.apif29BioService.getTranslationDictionary2(res[0].language, info)
                  .subscribe((res2: any) => {
                    var textToTA = drug.name.replace(/\n/g, " ");
                    console.log(res2[0].translations[0].text);
                    if(res2[0]!=undefined){
                      if(res2[0].translations[0]!=undefined){
                        textToTA = res2[0].translations[0].text;
                      }
                    }
                    drug.name=textToTA;
                      this.callTextAnalitycs2(drug);
                  }, (err) => {
                      console.log(err);
                      this.callTextAnalitycs2(drug);
                  }));
        }else{
          this.callTextAnalitycs2(drug);
        }
        
      }, (err) => {
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
        this.callTextAnalitycs2(drug);
      }));
    }else{
      this.callingTextAnalytics = false;
      if(this.editingDrugIndex>-1){
        if(this.isWizard){
          this.actualRequest.drugs[this.editingDrugIndex] = drug;
        }else{
          this.requests[0].drugs[this.editingDrugIndex] = drug;
        }
        
      }else{
        if(this.isWizard){
          this.actualRequest.drugs[this.editingDrugIndex] = drug;
          this.actualRequest.drugs.push(drug);
        }else{
          this.requests[0].drugs.push(drug);
        }
        
      }
      if(!this.isWizard){
        this.updateRequest(this.requests[0],0);
      }
      this.closePanel();
    }
    
  }

  callTextAnalitycs2(drug) {
    this.callingTextAnalytics = true;
    var info = drug.name.replace(/\n/g, " ");
    console.log(info);
    var jsontestLangText = { "text": info };
    this.subscription.add(this.apif29BioService.callTextAnalytics(jsontestLangText)
      .subscribe((res: any) => {
        this.resTextAnalyticsSegments = res;
        var foundDrug = false;
          for (let j = 0; j < this.resTextAnalyticsSegments.entities.length; j++) {
            var actualDrug = { name: '', dose: '', link: '', strength: '' };
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
              drug.name= actualDrug.name;
              drug.link= actualDrug.link;
              if(this.editingDrugIndex>-1){
                if(this.isWizard){
                  this.actualRequest.drugs[this.editingDrugIndex] = drug;
                }else{
                  this.requests[0].drugs[this.editingDrugIndex] = drug;
                }
                
              }else{
                if(this.isWizard){
                  this.actualRequest.drugs.push(drug);
                }else{
                  this.requests[0].drugs.push(drug);
                }
                
              }
              foundDrug = true;
              if(!this.isWizard){
                this.updateRequest(this.requests[0],0);
              }
              
            }
          }
          if(!foundDrug){
            if(this.editingDrugIndex>-1){
              if(this.isWizard){
                this.actualRequest.drugs[this.editingDrugIndex] = drug;
                this.actualRequest.drugs[this.editingDrugIndex].link = "";
              }else{
                this.requests[0].drugs[this.editingDrugIndex] = drug;
                this.requests[0].drugs[this.editingDrugIndex].link = "";
              }
              
            }else{
              drug.link = "";
              if(this.isWizard){
                this.actualRequest.drugs.push(drug);
              }else{
                this.requests[0].drugs.push(drug);
              }
              
            }
            if(!this.isWizard){
              this.updateRequest(this.requests[0],0);
            }
            
          }
        this.callingTextAnalytics = false;
        this.closePanel();

      }, (err) => {
        console.log(err);
        this.callingTextAnalytics = false;
        this.closePanel();
      }));
  }

  getChecks(){
    this.subscription.add( this.http.get(environment.api+'/api/requestclin/checks/'+this.requests[0]._id)
    .subscribe( (res : any) => {
      console.log(res);
      this.checks = res.checks;
      this.tasksLoaded = true;
     }, (err) => {
       console.log(err.error);
       this.tasksLoaded = true;
     }));
  }

  setChecks(){
    var paramssend = { checks: this.checks };
    this.subscription.add( this.http.put(environment.api+'/api/requestclin/checks/'+this.requests[0]._id, paramssend)
    .subscribe( (res : any) => {
      
     }, (err) => {
       console.log(err.error);
     }));
  }

  setCheck1(bool){
    this.checks.check1 = bool;
    this.setChecks();
  }

  setCheck2(bool){
    this.checks.check2 = bool;
    this.setChecks();
  }

  openModal(SampleDrug){
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(SampleDrug, ngbModalOptions);
  }

}

export let lineChartSeries = [
];

export let barChart: any = [
];