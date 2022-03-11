import { Component, OnInit, LOCALE_ID } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { DateService } from 'app/shared/services/date.service';
import { SortService } from 'app/shared/services/sort.service';
import { PatientService } from 'app/shared/services/patient.service';
import { Observable, of, OperatorFunction } from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge } from 'rxjs/operators'

import { v4 as uuidv4 } from 'uuid';
import { DateAdapter } from '@angular/material/core';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';
import { Options } from "@angular-slider/ngx-slider";
import { lineChartShowXAxisLabel } from 'app/shared/configs/general-charts.config';

export function getCulture() {
  return sessionStorage.getItem('culture');
}

@Component({
  selector: 'app-prom',
  templateUrl: './prom.component.html',
  styleUrls: ['./prom.component.scss'],
  providers: [PatientService, { provide: LOCALE_ID, useFactory: getCulture }, ApiDx29ServerService]
})
export class PromComponent {
  lang: string = 'en';
  userId: string = '';
  selectedPatient: any = {};
  loadedPatientId: boolean = false;
  loadedInfoPatient: boolean = false;
  sending: boolean = false;
  private subscription: Subscription = new Subscription();
  step: any = 0;

  loadedProms: boolean = false;
  proms: any = [];
  newproms: any = [];
  totalTaks: number = 8;
  pendingsTaks: number = 8;
  actualProm: any = {};
  prom6: any = {
    "Brightorpatternedlights": false,
    "Warmorcoldtemperatures": false,
    "Physicalmovementoractivity": false,
    "Noise": false,
    "Geometricpatterns": false,
    "Changesinemotionalstate": false,
    "Tiredness": false,
    "Other": false
  };
  prom8: string = '';
  value: number = 0;
  numSaved: number = 0;
  options: Options = {};
  goNext: boolean = false;
  pendind: boolean = false;
  showListQuestionnaires: boolean = true;
  a121: string = '';
  a122: string = '';


  constructor(private http: HttpClient, public translate: TranslateService, private dateAdapter: DateAdapter<Date>, private authService: AuthService, public toastr: ToastrService, private dateService: DateService, private patientService: PatientService, private sortService: SortService, private apiDx29ServerService: ApiDx29ServerService, private formBuilder: FormBuilder, private route: ActivatedRoute) {
    this.subscription.add( this.route.params.subscribe(params => {
      if(params['pendind']!=undefined){
        this.pendind = params['pendind'];
        //this.showListQuestionnaires = false;
      }else{
        this.pendind = false;
      }
      this.init();
    }));
    this.lang = sessionStorage.getItem('lang');        

    this.dateAdapter.setLocale(sessionStorage.getItem('lang'));

    this.translate.get('prom.a12.1').subscribe((res: string) => {
      this.a121 = res;
    });
    this.translate.get('prom.a12.2').subscribe((res: string) => {
      this.a122 = res;
      this.options = {
        showTicksValues: true,
        stepsArray: [
          { value: -4, legend: this.a121},
          { value: -3 },
          { value: -2 },
          { value: -1 },
          { value: 0 },
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 4, legend: this.a122}
        ]
      }
    });
   }

   init() {
    this.initEnvironment();
    this.loadPromQuestions();
  }

  loadPromQuestions(){
    this.newproms = [];
    this.newproms.push({idProm:1, data:null})
    this.newproms.push({idProm:2, data:null})
    this.newproms.push({idProm:3, data:null})
    this.newproms.push({idProm:4, data:null})
    this.newproms.push({idProm:5, data:null})
    this.newproms.push({idProm:6, data:this.prom6})
    this.newproms.push({idProm:7, data:null})
    this.newproms.push({idProm:8, data:null})
  }

  filterNewProms(){
    console.log('entra');
    var copyProms = [];
    for(var i=0;i<this.newproms.length;i++){
      var foundProm = false;
      for(var j=0;j<this.proms.length && !foundProm;j++){
        if(this.newproms[i].idProm == this.proms[j].idProm){
          foundProm = true;
        }
      }
      if(!foundProm){
        copyProms.push(this.newproms[i]);
      }
    }
    this.newproms = [];
    this.newproms = JSON.parse(JSON.stringify(copyProms));
    this.actualProm = this.newproms[this.step];
    this.loadedProms = true;
  }

  showAll(){
    this.numSaved = 0;
    for(var i=0;i<this.newproms.length;i++){
      var foundProm = false;
      for(var j=0;j<this.proms.length && !foundProm;j++){
        if(this.newproms[i].idProm == this.proms[j].idProm){
          this.newproms[i] = this.proms[j];
          this.newproms[i].hasAnswer = true;
          this.numSaved++;
          foundProm = true;
        }
      }
      if(!foundProm){
        this.newproms[i].hasAnswer = false;
      }
    }
    this.actualProm = this.newproms[this.step];
    this.loadedProms = true;
  }

  initEnvironment(){
    this.userId = this.authService.getIdUser();
    console.log(this.authService.getCurrentPatient());
    if(this.authService.getCurrentPatient()==null){
      this.loadPatientId();
    }else{
      this.loadedPatientId = true;
      this.selectedPatient = this.authService.getCurrentPatient();
      this.getProms();
    }
  }

  loadPatientId(){
    this.loadedPatientId = false;
    this.subscription.add( this.patientService.getPatientId()
    .subscribe( (res : any) => {
      if(res==null){
        this.authService.logout();
      }else{
        this.loadedPatientId = true;
        this.authService.setCurrentPatient(res);
        this.selectedPatient = res;
        this.getProms();
      }
     }, (err) => {
       console.log(err);
     }));
  }

  getLiteral(literal) {
    return this.translate.instant(literal);
  }

  getProms(){
    this.proms = [];
    this.loadedProms = false;
    var info = {rangeDate: ''}
    console.log(this.authService.getCurrentPatient());
        this.subscription.add(this.http.post(environment.api + '/api/prom/dates/' + this.authService.getCurrentPatient().sub, info)
        .subscribe((res:any)=>{
          this.proms = res;
          console.log(res);
          if(this.pendind){
            this.filterNewProms();
          }else{
            this.showAll();
          }
          
          this.totalTaks = this.totalTaks - res.length;
          this.pendingsTaks = this.totalTaks;
          console.log(res);
          
            }, (err) => {
              console.log(err);
              this.loadedProms = true;
            }));
  }

  //  On submit click, reset field value
  saveProm(){
    this.sending = true;
      this.subscription.add( this.http.post(environment.api+'/api/prom/'+this.authService.getCurrentPatient().sub, this.actualProm)
        .subscribe((res: any) => {
          console.log(res);
          this.sending = false;
          this.newproms[this.step] = res.prom;
          this.step++;
          if(this.step+1<=this.newproms.length){
            this.actualProm = this.newproms[this.step];
          }
          this.goNext = false;
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));
  }

  updateProm(){
    this.sending = true;
      this.subscription.add( this.http.put(environment.api+'/api/prom/'+this.actualProm._id, this.actualProm)
        .subscribe((res: any) => {
          this.sending = false;
          this.newproms[this.step] = res.prom;
          this.step++;
          if(this.step+1<=this.newproms.length){
            this.actualProm = this.newproms[this.step];
          }
          this.goNext = false;
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));
  }

  saveChanges(){
    console.log(this.newproms);
    this.sending = true;
      this.subscription.add( this.http.post(environment.api+'/api/proms/'+this.authService.getCurrentPatient().sub, this.newproms)
        .subscribe((res: any) => {
          console.log(res);
          this.sending = false;
          this.init();
        }, (err) => {
          console.log(err);
          Swal.fire(this.translate.instant("generics.Warning"), this.translate.instant("generics.error try again"), "warning");
          this.sending = false;
        }));
  }

  previousProm(){
    this.step--;
    this.actualProm = this.newproms[this.step];
  }

  nextProm(){
    this.goNext = true;
    if(this.actualProm.idProm==6){
      var foundElementTrue = false;
      for(var i in this.prom6) {
        if(this.prom6[i]){
          foundElementTrue = true;
        }
      }
      if(foundElementTrue){
        this.actualProm.data = this.prom6;
      }
      
    }
    /*if(this.actualProm.idProm==8){
      if(this.actualProm.data=='Improvement in other symptoms'){

      }
    }*/
    if(this.actualProm.data!=null){
      if(this.actualProm._id){
        this.updateProm();
      }else{
        this.saveProm();
      }
      
    }
    
  }

  setValue(value){
    this.actualProm.data=value;
  }

}
