import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class PatientService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    getPatientId(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
        .map( (res : any) => {
          if(res.listpatients.length>0){
            this.authService.setPatientList(res.listpatients);
            this.authService.setCurrentPatient(res.listpatients[0]);
            this.authService.setGroup(res.listpatients[0].group);
            return this.authService.getCurrentPatient();
          }else{
            return null;
          }
         }, (err) => {
           console.log(err);
         })
    }

    getPatientWeight(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/weight/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    getPatientHeight(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/height/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    getGeneralShare(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/openraito/patient/generalshare/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    setGeneralShare(info){
      //cargar las faqs del knowledgeBaseID
      return this.http.post(environment.api+'/api/openraito/patient/generalshare/'+this.authService.getCurrentPatient().sub, info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    getCustomShare(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/openraito/patient/customshare/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    setCustomShare(info){
      //cargar las faqs del knowledgeBaseID
      return this.http.post(environment.api+'/api/openraito/patient/customshare/'+this.authService.getCurrentPatient().sub, info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    getIndividualShare(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/openraito/patient/individualshare/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    setIndividualShare(info){
      //cargar las faqs del knowledgeBaseID
      return this.http.post(environment.api+'/api/openraito/patient/individualshare/'+this.authService.getCurrentPatient().sub, info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    getDocuments(){
      return this.http.get(environment.api+'/api/documents/'+this.authService.getCurrentPatient().sub)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    addDocument(info){
      return this.http.post(environment.api+'/api/document/'+this.authService.getCurrentPatient().sub, info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    deleteDocument(documentId){
      return this.http.delete(environment.api+'/api/document/'+documentId)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

}
