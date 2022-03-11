import { Component, ViewChild, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastrService } from 'ngx-toastr';
import swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';
import { SortService} from 'app/shared/services/sort.service';


@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss']
})

export class UsersAdminComponent implements OnDestroy{
  @ViewChild('f') newLangForm: NgForm;

  addedlang: boolean = false;
  lang: any;
  allLangs: any;
  langs: any;
  working: boolean = false;
  sending: boolean = false;
  loadingUsers: boolean = false;
  users: any = [];
  usersCopy: any = [];
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  currentGroup: any;
  countries: any;
  groupId: any;
  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 4;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastrService, private modalService: NgbModal, private dateService: DateService,private adapter: DateAdapter<any>, private sortService: SortService){

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
    this.currentGroup = this.authService.getGroup()
    console.log(this.currentGroup);
    
    this.loadGroupId();
  }

  loadCountries(){
    this.subscription.add( this.http.get('assets/jsons/countries.json')
    .subscribe( (res : any) => {
      this.countries=res;
      this.getUsers();
    }, (err) => {
      console.log(err);
      this.getUsers();
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadGroupId(){
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
        this.getUsers();
        this.loadDrugs();
      }, (err) => {
        console.log(err);
    }));
  }

  getUsers(){
    this.loadingUsers = true;
    console.log(this.authService.getGroup());
    this.subscription.add( this.http.get(environment.api+'/api/admin/users/'+this.groupId)
    .subscribe( (res : any) => {
      this.loadingUsers = false;
      for(var j=0;j<res.length;j++){
        res[j].userName = this.capitalizeFirstLetter(res[j].userName);
        res[j].phone = res[j].countryselectedPhoneCode +' '+res[j].phone;
        //res[j].iconUrl = 'https://i.pinimg.com/564x/5e/98/5e/5e985e71d0f954f7c602794318eb323d.jpg'
      }

      res.sort(this.sortService.GetSortOrder("userName"));
      this.users = res;
      this.usersCopy = JSON.parse(JSON.stringify(res));

      
    }, (err) => {
      console.log(err);
      this.loadingUsers = false;
    }));
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getNameCountry(value){
    var res = '';
    var enc=false;
    for(var i =0; i<this.countries.length;i++){
      if(this.countries[i].code==value){
        res= this.countries[i].name;
        enc = true;
      }
    }
    return res;

  }

  fieldStatusChanged(row){
    console.log(row);
    var data = {status: row.status};
    this.subscription.add( this.http.put(environment.api+'/api/patient/status/'+row.patientId, data)
    .subscribe( (res : any) => {
      console.log(res);
      //this.getUsers();
     }, (err) => {
       console.log(err);
     }));
    //this.user = user;
  }

  saveNotes(){
    var data = {notes: this.user.notes};
    this.subscription.add( this.http.put(environment.api+'/api/patients/changenotes/'+this.user.patientId, data)
    .subscribe( (res : any) => {
      console.log(res);
      //this.getUsers();
     }, (err) => {
       console.log(err);
     }));
    //this.user = user;
  }

  closePanel(){
    //this.users = JSON.parse(JSON.stringify(this.usersCopy));
    this.modalReference.close();
  }


  userChangedEvent(user, event){
    var data = {blockedaccount: event} ;
    this.subscription.add( this.http.put(environment.api+'/api/admin/users/state/'+user.userId, data)
    .subscribe( (res : any) => {
      this.usersCopy = JSON.parse(JSON.stringify(this.users));
     }, (err) => {
       console.log(err);
     }));
  }


  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.users));
    tempRes = this.addedMetadata(tempRes);
    this.createFile(this.users);
  }

  addedMetadata(res){
      res.metadata = {};
      res.metadata.unitsOfMeasure = {};
      res.metadata.unitsOfMeasure['Weight'] = 'Kg';
      res.metadata.unitsOfMeasure['Height'] = 'cm';
      res.metadata.unitsOfMeasure['Drugs dose'] = 'mg';
    return res;
  }

  createFile(res){
    var json = JSON.stringify(res);
      
    var blob = new Blob([json], {type: "application/json"});
    var url  = URL.createObjectURL(blob);
    var p = document.createElement('p');
    document.getElementById('content').appendChild(p);

    var a = document.createElement('a');
    var dateNow = new Date();
    var stringDateNow = this.dateService.transformDate(dateNow);
    a.download    = "dataRaito_"+stringDateNow+".json";
    a.href        = url;
    a.textContent = "dataRaito_"+stringDateNow+".json";
    a.setAttribute("id", "download")

    document.getElementById('content').appendChild(a);
    document.getElementById("download").click();
  }


  loadDrugs(){
    this.subscription.add( this.http.get(environment.api+'/api/group/medications/'+this.groupId)
    .subscribe( (res : any) => {
      if(res.medications.data.length == 0){
        //no tiene medications
      }else{
        for (var i = 0; i < res.medications.data.drugs.length; i++) {
          //this.annotations.drugs.push({_id: res.medications.data.drugs[i]._id, name:res.medications.data.drugs[i].name, annotations:res.medications.data.drugs[i].annotations})
        }
      }
     }, (err) => {
       console.log(err);
     }));
  }

  viewInfoPatient(user,InfoPatient){
    console.log(user);
    this.user = user;
    this.modalReference = this.modalService.open(InfoPatient);
  }

}
