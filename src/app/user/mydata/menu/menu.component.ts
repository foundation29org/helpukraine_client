import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { DateService } from 'app/shared/services/date.service';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Subscription';
import { PatientService } from 'app/shared/services/patient.service';
import { SortService } from 'app/shared/services/sort.service';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { Apif29BioService } from 'app/shared/services/api-f29bio.service';
import { jsPDFService } from 'app/shared/services/jsPDF.service'
import { TermsConditionsPageComponent } from "app/pages/content-pages/terms-conditions/terms-conditions-page.component";
import Swal from 'sweetalert2';
import { sha512 } from "js-sha512";
import { Clipboard } from "@angular/cdk/clipboard"

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  providers: [PatientService, ApiDx29ServerService, jsPDFService, Apif29BioService]
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('accordion') accordion: NgbAccordion;
  data: any[];
  modalReference: NgbModalRef;
  modalProfileReference: NgbModalRef;
  loading: boolean = false;
  loadedShareData: boolean = false;
  private subscription: Subscription = new Subscription();
  private msgDownload: string;
  private tittleExportData: string;
  private msgDataSavedOk: string;
  private msgDataSavedFail: string;
  loadedPatientId: boolean = false;
  hasGroup: boolean = false;
  consentgroup: boolean = false;
  activeIds = [];
  myEmail: string = '';
  lang: string = 'en';
  newPermission:any;
  @ViewChild('f') sendForm: NgForm;
  mode: string = 'General';
  listCustomShare = [];
  individualShare = [];
  showNewCustom: boolean = false;

  constructor(private modalService: NgbModal, private http: HttpClient, private authService: AuthService, public translate: TranslateService, private dateService: DateService, private patientService: PatientService, private route: ActivatedRoute, private router: Router, private apiDx29ServerService: ApiDx29ServerService, public jsPDFService: jsPDFService, private sortService: SortService, private apif29BioService: Apif29BioService, private clipboard: Clipboard) { 
    this.subscription.add(this.route
      .queryParams
      .subscribe(params => {
        if(params['panel']!=undefined){
          this.activeIds=[params['panel']]
        }
      }));
      this.lang = sessionStorage.getItem('lang');
  }

  ngOnInit(): void {
    this.loadTranslations();
    this.loadPatientId();
    this.loadMyEmail()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isOpen(i): boolean {
    if(this.accordion){
      return this.accordion && this.accordion.activeIds.includes(i.toFixed());
    }else{
      return false;
    }
 }
 
 showHelpFHIRPopup(contentInfoFHIR) {
  let ngbModalOptions: NgbModalOptions = {
    keyboard: false,
    windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference = this.modalService.open(contentInfoFHIR, ngbModalOptions);
}

closeModal() {
  if (this.modalReference != undefined) {
    this.modalReference.close();
    this.modalReference = undefined;
  }
}

//traducir cosas
loadTranslations(){
  this.translate.get('generics.Data saved successfully').subscribe((res: string) => {
    this.msgDataSavedOk=res;
  });
  this.translate.get('generics.Data saved fail').subscribe((res: string) => {
    this.msgDataSavedFail=res;
  });
  this.translate.get('generics.ExportData').subscribe((res: string) => {
    this.tittleExportData=res;
  });
  this.translate.get('generics.Download').subscribe((res: string) => {
    this.msgDownload=res;
  });
}

loadPatientId(){
  this.loadedPatientId = false;
  this.subscription.add( this.patientService.getPatientId()
  .subscribe( (res : any) => {
    if(res==null){
      this.authService.logout();
    }else{
      console.log(res);
      if(res.group!=null){
        this.hasGroup = true;
        this.getConsentGroup();
        if(this.accordion){
          this.accordion.activeIds=this.activeIds;
        }
      }
    }
   }, (err) => {
     console.log(err);
   }));
}

getConsentGroup(){
  this.subscription.add( this.http.get(environment.api+'/api/patient/consentgroup/'+this.authService.getCurrentPatient().sub)
  .subscribe( (res : any) => {
    console.log(res);
    this.consentgroup = res.consentgroup;
   }, (err) => {
     console.log(err.error);
   }));
}

changeConsentGroup(value){
  var paramssend = { consentgroup: value };
  this.subscription.add( this.http.put(environment.api+'/api/patient/consentgroup/'+this.authService.getCurrentPatient().sub, paramssend)
  .subscribe( (res : any) => {
    this.consentgroup = value;
   }, (err) => {
     console.log(err.error);
   }));
}

exportData(){
  //cargar los datos del usuario
  this.loading = true;
  document.getElementById('content').innerHTML = "";
  this.subscription.add( this.patientService.getPatientId()
  .subscribe( (res1 : any) => {
    if(res1!=null){
      this.subscription.add( this.http.get(environment.api+'/api/exportdata/'+this.authService.getCurrentPatient().sub)
      .subscribe( (res : any) => {
        var json = JSON.stringify(res);
        var blob = new Blob([json], {type: "application/json"});
        var url  = URL.createObjectURL(blob);
        var p = document.createElement('p');
        var t = document.createTextNode(this.msgDownload+":");
        p.appendChild(t);
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
        this.loading = false;
       }, (err) => {
         console.log(err);
         this.loading = false;
       }));
    }else{
      Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.There is no patient data to export"), "warning");
      this.loading = false;
    }
   }, (err) => {
     console.log(err);
     this.loading = false;
   }));
}

exportPDF(){
  var infoDiseases = [];//this.getPlainInfoDiseases();
  var phenotype = [];
  this.subscription.add(this.apiDx29ServerService.getSymptoms(this.authService.getCurrentPatient().sub)
    .subscribe(async (res: any) => {
      if (!res.message) {
        if (res.phenotype.data.length > 0) {
          res.phenotype.data.sort(this.sortService.GetSortOrder("name"));
          phenotype = res.phenotype.data;

          var hposStrins = [];
          phenotype.forEach(function (element) {
              hposStrins.push(element.id);
            });
            //get symtoms
            var phenotype2 = await this.callGetInfoTempSymptomsJSON(hposStrins, phenotype);
            console.log(phenotype2);
            this.jsPDFService.generateResultsPDF(phenotype2, infoDiseases, this.lang)
            //phenotype = this.callGetInfoTempSymptomsJSON(hposStrins, phenotype);
        }else{
          this.jsPDFService.generateResultsPDF(phenotype, infoDiseases, this.lang)
        }
      }else{
        this.jsPDFService.generateResultsPDF(phenotype, infoDiseases, this.lang)
      }
      
    }, (err) => {
      console.log(err);
    }));
  
}

async callGetInfoTempSymptomsJSON(hposStrins, phenotype) {
  return new Promise(async function (resolve, reject) {
    var lang = this.lang;
    this.subscription.add(this.apif29BioService.getInfoOfSymptoms(lang, hposStrins)
      .subscribe((res: any) => {
  
        var tamano = Object.keys(res).length;
        if (tamano > 0) {
          for (var i in res) {
            for (var j = 0; j < phenotype.length; j++) {
              if (res[i].id == phenotype[j].id) {
                phenotype[j].name = res[i].name;
                phenotype[j].def = res[i].desc;
                phenotype[j].synonyms = res[i].synonyms;
                phenotype[j].comment = res[i].comment;
                if (phenotype[j].importance == undefined) {
                  phenotype[j].importance = 1;
                }
              }
            }
          }
          phenotype.sort(this.sortService.GetSortOrder("name"));
        }
        resolve (phenotype);
  
      }, (err) => {
        resolve ([]);
      }));
  }.bind(this));
  
}

loadSymptoms() {
  var para = this.authService.getCurrentPatient();
  //cargar el fenotipo del usuario
  
}

confirmDelete(index, index2) {
  Swal.fire({
    title: this.translate.instant("generics.This action will not be reversed"),
    html: this.translate.instant("generics.confirm delete data"),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#33658a',
    cancelButtonColor: '#B0B6BB',
    confirmButtonText: this.translate.instant("generics.Yes"),
    cancelButtonText: this.translate.instant("generics.No"),
    showLoaderOnConfirm: true,
    allowOutsideClick: false,
    reverseButtons: true
  }).then((result) => {
    if (result.value) {
      Swal.fire({
        title: this.translate.instant("mydata.please enter your password"),
        inputPlaceholder: this.translate.instant("mydata.Write your password here"),
        input: 'password',
        confirmButtonText: this.translate.instant("mydata.Deletedata"),
        cancelButtonText: this.translate.instant("generics.Cancel"),
        showCancelButton: true,
        reverseButtons: true
      }).then(function (pw) {
        if (pw.value) {
          var password = sha512(pw.value);
          this.deleteData(password);
        } else {
          console.log('rechaza');
        }
        
      }.bind(this))
      
    }
  });

}

loadMyEmail(){
  this.subscription.add( this.http.get(environment.api+'/api/users/email/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      this.myEmail = res.email;
    }, (err) => {
      console.log(err);
    }));
}

deleteData(password){
  //cargar los datos del usuario
  this.loading = true;
  var info = {password: password, email: this.myEmail}
  this.subscription.add( this.http.post(environment.api+'/api/deleteaccount/'+this.authService.getIdUser(), info)
  .subscribe( (res : any) => {
    if(res.message=='The case has been eliminated'){
      Swal.fire({
        title: this.translate.instant("generics.It has been successfully removed"),
        icon: 'success',
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
      }).then((result) => {
    
      });
        setTimeout(function () {
          
          Swal.close();
          window.location.reload();
      }.bind(this), 1500);
    }else{
      Swal.fire(this.translate.instant("mydata.Password is incorrect"), this.translate.instant("mydata.we will close your session"), "warning");
      this.authService.logout();
      this.router.navigate([this.authService.getLoginUrl()]);
    }
    
    
    
    /*this.authService.logout();
    this.router.navigate([this.authService.getLoginUrl()]);*/
   }, (err) => {
     console.log(err);
     this.loading = false;
   }));
}

openTerms() {
  let ngbModalOptions: NgbModalOptions = {
    backdrop: 'static',
    keyboard: false,
    windowClass: 'ModalClass-sm'
  };
  const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
  modalRef.componentInstance.role = 'Dravet';
}

resetPermisions(){
  var dateNow = new Date();
  var stringDateNow = this.dateService.transformDate(dateNow);
  this.newPermission={
    data:{patientInfo:false, medicalInfo:false,devicesInfo:false, genomicsInfo:false},
    notes:'',
    date: stringDateNow,
    token: this.getUniqueFileName(),
    operations:[]
  };
}

share(shareTo, mode){
  this.resetPermisions();
  this.mode = mode;
  if(this.mode=='General'){
    this.loadGeneralShare();
  }else{
    this.loadCustomShare();
    this.getIndividualShare();
  }
  
  this.openModal(shareTo);
}

loadGeneralShare(){
  this.loadedShareData = false;
  this.subscription.add( this.patientService.getGeneralShare()
  .subscribe( (res : any) => {
    console.log(res);
    this.newPermission = res.generalShare;
    this.loadedShareData = true;
   }, (err) => {
     console.log(err);
     this.loadedShareData = true;
   }));
}

loadCustomShare(){
  this.loadedShareData = false;
  this.subscription.add( this.patientService.getCustomShare()
  .subscribe( (res : any) => {
    console.log(res);
    this.listCustomShare = res.customShare;
    this.loadedShareData = true;
   }, (err) => {
     console.log(err);
     this.loadedShareData = true;
   }));
}

getIndividualShare(){
  this.subscription.add( this.patientService.getIndividualShare()
  .subscribe( (res : any) => {
    console.log(res);
    this.individualShare = res.individualShare;
   }, (err) => {
     console.log(err);
   }));
}

openRequester(clinicalProfilePanel){
  let ngbModalOptions: NgbModalOptions = {
    backdrop : 'static',
    keyboard : false,
    windowClass: 'ModalClass-sm'// xl, lg, sm
};
this.modalProfileReference = this.modalService.open(clinicalProfilePanel, ngbModalOptions);
}

closeModalProfile() {
  if (this.modalProfileReference != undefined) {
    this.modalProfileReference.close();
    this.modalProfileReference = undefined;
  }
}

openModal(modaltemplate){
  let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
        keyboard : false,
        windowClass: 'ModalClass-xl'// xl, lg, sm
  };
  this.modalReference = this.modalService.open(modaltemplate, ngbModalOptions);
}

editindividual(i){
  this.newPermission= this.individualShare[i];
  this.mode = 'Individual';
  console.log(this.newPermission);
  this.showNewCustom = true;
}

submitInvalidForm() {
  if (!this.sendForm) { return; }
  const base = this.sendForm;
  for (const field in base.form.controls) {
    if (!base.form.controls[field].valid) {
        base.form.controls[field].markAsTouched()
    }
  }
}

sendShare(){
  console.log(this.newPermission);
  if(this.mode=='General'){
    this.setGeneralShare();
  }else if(this.mode=='Individual'){
    this.setIndividualShare();
  }else{
    this.setCustomShare();
  }
}

fieldStatusChanged(oneCustomShare){
  console.log(oneCustomShare);
  this.newPermission = oneCustomShare;
  this.setIndividualShare();
}

setIndividualShare(){
  console.log(this.newPermission);
  if(this.newPermission._id != null){
    var found = false;
    for (var i = 0; i <= this.individualShare.length && !found; i++) {
      if(this.individualShare[i]._id==this.newPermission._id){
        this.individualShare[i] = this.newPermission;
        found = true;
      }
    }
    if(found){
      var info = {individualShare: this.individualShare}      
      this.subscription.add( this.patientService.setIndividualShare(info)
      .subscribe( (res : any) => {
        console.log(res);
        this.getIndividualShare();
        this.resetPermisions();
        this.showNewCustom=false;
        this.loadedShareData = true;
      }, (err) => {
        console.log(err);
        this.loadedShareData = true;
      }));
    }
    
  }
}

setGeneralShare(){
  this.loadedShareData = false;
  this.subscription.add( this.patientService.setGeneralShare(this.newPermission)
  .subscribe( (res : any) => {
    console.log(res);
    //this.listCustomShare = res.customShare;
    this.loadedShareData = true;
    this.modalReference.close();
   }, (err) => {
     console.log(err);
     this.loadedShareData = true;
   }));
}

setCustomShare(){
  this.loadedShareData = false;
  if(this.newPermission._id == null){
    this.listCustomShare.push(this.newPermission)
  }else{
    var found = false;
    for (var i = 0; i <= this.listCustomShare.length && !found; i++) {
      if(this.listCustomShare[i]._id==this.newPermission._id){
        this.listCustomShare[i] = this.newPermission;
        found = true;
      }
    }
  }
  
  this.subscription.add( this.patientService.setCustomShare(this.listCustomShare)
  .subscribe( (res : any) => {
    console.log(res);
    this.resetPermisions();
    this.showNewCustom=false;
    this.listCustomShare = res.customShare;
    this.loadedShareData = true;
   }, (err) => {
     console.log(err);
     this.loadedShareData = true;
   }));
}

/*getUniqueFileName() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  var h = now.getHours();
  var mm = now.getMinutes();
  var ss = now.getSeconds();
  var ff = Math.round(now.getMilliseconds() / 10);
  var date = '' + y.toString().substr(-2) + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d + (h < 10 ? '0' : '') + h + (mm < 10 ? '0' : '') + mm + (ss < 10 ? '0' : '') + ss + (ff < 10 ? '0' : '') + ff;
  var randomString = this.makeid(8);
  var name = date + randomString;
  var url = y.toString().substr(-2) + '/' + (m < 10 ? '0' : '') + m + '/' + (d < 10 ? '0' : '') + d + '/' + name;
  return url;
}*/

getUniqueFileName() {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@$^*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 20;
  var password = "";
  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber +1);
   }
   //var url = environment.urlRaito+'/?key='+this.authService.getCurrentPatient().sub+'&token='+password
   var url = '/?key='+this.authService.getCurrentPatient().sub+'&token='+password
   //var url = password
  return url;
}

makeid(length) {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += Math.floor(Math.random() * charactersLength);
  }
  return result;
}

editcustom(i){
  this.newPermission= this.listCustomShare[i];
  this.mode = 'Custom';
  console.log(this.newPermission);
  this.showNewCustom = true;
}

confirmRevoke(i){
  Swal.fire({
      title: this.translate.instant("generics.Are you sure?"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#33658a',
      cancelButtonColor: '#B0B6BB',
      confirmButtonText: this.translate.instant("generics.Delete"),
      cancelButtonText: this.translate.instant("generics.No"),
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      reverseButtons:true
  }).then((result) => {
    if (result.value) {
      this.revokePermission(i);
    }
  });
}

revokePermission(i){
  this.loadedShareData = false;
  this.listCustomShare.splice(i, 1);
  console.log(this.listCustomShare);
  this.subscription.add( this.patientService.setCustomShare(this.listCustomShare)
  .subscribe( (res : any) => {
    console.log(res);
    this.showNewCustom=false;
    //this.listCustomShare = res.customShare;
    this.loadedShareData = true;
   }, (err) => {
     console.log(err);
     this.loadedShareData = true;
   }));
}

addCustom(){
  this.showNewCustom = true;
}

cancelCustom(){
  this.showNewCustom = false;
}

closeModalShare() {
  if (this.modalReference != undefined) {
    this.showNewCustom = false;
    this.modalReference.close();
    this.modalReference = undefined;
  }
}

copyClipboard(data){
  var urlcopy = environment.urlOpenRaito+data;
  this.clipboard.copy(urlcopy);
      Swal.fire({
        icon: 'success',
        html: this.translate.instant("generics.Copied to the clipboard"),
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
      })

      setTimeout(function () {
        Swal.close();
      }, 2000);
}

}
