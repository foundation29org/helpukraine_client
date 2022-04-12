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
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import {DateAdapter} from '@angular/material/core';
import { SortService} from 'app/shared/services/sort.service';
import { json2csv } from 'json-2-csv';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { BlobStorageSupportService, IBlobAccessToken } from 'app/shared/services/blob-storage-support.service';

@Component({
    selector: 'app-users-admin',
    templateUrl: './users-admin.component.html',
    styleUrls: ['./users-admin.component.scss'],
    providers: [ApiDx29ServerService]
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
  user: any = {};
  modalReference: NgbModalRef;
  private subscription: Subscription = new Subscription();
  timeformat="";
  currentGroup: any;
  countries: any;
  groupId: any;
  groupEmail: any;
  // Google map lat-long
  lat: number = 50.431134;
  lng: number = 30.654701;
  zoom = 3;
  rowIndex: number = -1;
  emailMsg="";
  msgList: any = {};
  accessToken: IBlobAccessToken = {
    // tslint:disable-next-line:max-line-length
    sasToken: environment.blobAccessToken.sasToken,
    blobAccountUrl: environment.blobAccessToken.blobAccountUrl,
    containerName: 'filessupport'
  };

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private authGuard: AuthGuard, public toastr: ToastrService, private modalService: NgbModal, private dateService: DateService,private adapter: DateAdapter<any>, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private blob: BlobStorageSupportService){

    this.adapter.setLocale(this.authService.getLang());
    this.lang = this.authService.getLang()
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
    this.loadGroupId();
    this.getAzureBlobSasToken();
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
        this.groupEmail = resGroup.email;
        this.groupId = resGroup._id;
        this.getUsers();
      }, (err) => {
        console.log(err);
    }));
  }

  getUsers(){
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/admin/users/'+this.groupId)
    .subscribe( (res : any) => {
      for(var j=0;j<res.length;j++){
        res[j].userName = this.capitalizeFirstLetter(res[j].userName);
        if(res[j].role=='User'){
          res[j].icon = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FF0000'
        }else{
          res[j].icon = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|4286f4'
        }
      }
      res.sort(this.sortService.GetSortOrder("userName"));
      this.users = res;
      this.loadingUsers = false;
      //this.getRequests();
      
    }, (err) => {
      console.log(err);
      this.loadingUsers = false;
    }));
  }

  getRequests(){
    this.loadingUsers = true;
    this.subscription.add( this.http.get(environment.api+'/api/admin/requestclin/'+this.groupId)
    .subscribe( (res : any) => {
      
      for(var j=0;j<res.length;j++){
        res[j].userName = this.capitalizeFirstLetter(res[j].userName);
        
        res[j].role = 'Clinical';
        this.users.push(res[j]);
      }
      res.sort(this.sortService.GetSortOrder("userName"));
      this.loadingUsers = false;
      
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
    var status = row.status;
    if(row.status=='new'){
      status = this.translate.instant("war.status.opt1");
    }else if(row.status=='contacted'){
      status = this.translate.instant("war.status.opt2");
    }else if(row.status=='pending'){
      status = this.translate.instant("war.status.opt3");
    }else if(row.status=='ontheway'){
      status = this.translate.instant("war.status.opt4");
    }else if(row.status=='contactlost'){
      status = this.translate.instant("war.status.opt5");
    }else if(row.status=='helped'){
      status = this.translate.instant("war.status.opt6");
    }
    var data = {status: row.status, email: row.email, groupEmail: row.groupEmail, userName: row.userName,lang: row.lang, group: this.authService.getGroup(), statusInfo: status};
    if(row.role=='User'){
      this.subscription.add( this.http.put(environment.api+'/api/patient/status/'+row.patientId, data)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
       }, (err) => {
         console.log(err);
       }));
    }else{
      this.subscription.add( this.http.put(environment.api+'/api/requestclin/status/'+row.patientId, data)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
       }, (err) => {
         console.log(err);
       }));
    }
    
    //this.user = user;
  }

  saveNotes(){
    var data = {notes: this.user.notes};
    if(this.user.role=='User'){
      this.subscription.add( this.http.put(environment.api+'/api/patients/changenotes/'+this.user.patientId, data)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
       }, (err) => {
         console.log(err);
       }));
    }else{
      this.subscription.add( this.http.put(environment.api+'/api/requestclin/changenotes/'+this.user.patientId, data)
      .subscribe( (res : any) => {
        this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
       }, (err) => {
         console.log(err);
       }));
    }
    
    //this.user = user;
  }

  closePanel(){
    this.modalReference.close();
  }


  userChangedEvent(user, event){
    var data = {blockedaccount: event} ;
    this.subscription.add( this.http.put(environment.api+'/api/admin/users/state/'+user.userId, data)
    .subscribe( (res : any) => {
      console.log(res);
     }, (err) => {
       console.log(err);
     }));
  }


  onSubmitExportData(){
    var tempRes = JSON.parse(JSON.stringify(this.users));
    for(var j=0;j<tempRes.length;j++){
      delete tempRes[j].icon;
    }
    this.createFile(tempRes);
  }

  createFile(res){
    let json2csvCallback = function (err, csv) {
      if (err) throw err;
      var blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    var url  = URL.createObjectURL(blob);
    var p = document.createElement('p');
    document.getElementById('content').appendChild(p);

    var a = document.createElement('a');
    var dateNow = new Date();
    var stringDateNow = this.dateService.transformDate(dateNow);
    a.download    = "reliefukraine_"+stringDateNow+".csv";
    a.href        = url;
    a.textContent = "reliefukraine_"+stringDateNow+".csv";
    a.setAttribute("id", "download")

    document.getElementById('content').appendChild(a);
    document.getElementById("download").click();
  }.bind(this);

  var options ={'expandArrayObjects' :true, "delimiter": { 'field': ';' }, excelBOM: true}
  json2csv(res, json2csvCallback, options);

  }

  viewInfoPatient(user,InfoPatient){
    this.user = user;
    if(user.lat!=''){
      this.lat = Number(user.lat)
      this.lng = Number(user.lng)
      this.zoom = 5;
    }
    
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-xl'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(InfoPatient, ngbModalOptions);
  }

  goToLink(msg){
    var description = msg.replace(/\n/g, "%0A")
    var url = 'https://translate.google.com/?hl=en&sl=uk&tl='+this.lang+'&text='+description+'&op=translate'
      window.open(url, "_blank");
  }

  setPositionMap(row){
    this.lat = Number(row.lat)
    this.lng = Number(row.lng)
    this.zoom = 6;
    window.scrollTo(0, 0)
  }

  openModal(rowIndex, row,EmailPanel){
    this.rowIndex = rowIndex;
    this.emailMsg = row.email;
    this.msgList = row.msgs;
    let ngbModalOptions: NgbModalOptions = {
      keyboard: false,
      windowClass: 'ModalClass-lg'// xl, lg, sm
    };
    this.modalReference = this.modalService.open(EmailPanel, ngbModalOptions);
  }

  getAzureBlobSasToken(){
    this.subscription.add( this.apiDx29ServerService.getAzureBlobSasToken('filessupport')
    .subscribe( (res : any) => {
      this.accessToken.sasToken = '?'+res;
      this.blob.init(this.accessToken);
    }, (err) => {
      console.log(err);
    }));
  }

  fieldStatusChanged2(msg, index){
    console.log(index)
    msg.statusDate = Date.now();
    this.subscription.add( this.http.put(environment.api+'/api/support/'+msg._id, msg)
    .subscribe( (res : any) => {
      //this.loadMsg();
      this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
      this.users[this.rowIndex].msgs[index].status = msg.status;
      this.users[this.rowIndex].unread = false;
      this.users[this.rowIndex].msgs.forEach(function(u) {
        if(u.status=='unread'){
          this.users[this.rowIndex].unread = true;
        }
      }.bind(this))
     }, (err) => {
       console.log(err.error);
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         this.toastr.error('', this.translate.instant("generics.error try again"));
       }
     }));
  }

  goToLinkMsg(msg){
    var description = msg.description.replace(/\n/g, "%0A")
    var url = 'https://translate.google.com/?hl=en&sl=uk&tl='+this.lang+'&text=Subject:%0A'+msg.subject+'%0A%0AMessage:%0A'+description+'&op=translate'
      window.open(url, "_blank");
  }
  

}
