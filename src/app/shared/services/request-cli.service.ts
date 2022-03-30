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
export class RequestCliService {
    constructor(private authService: AuthService, private http: HttpClient) {}

    getRequests(){
      //cargar las faqs del knowledgeBaseID
      return this.http.get(environment.api+'/api/requestclin/'+this.authService.getIdUser())
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    saveRequest(info){
      //cargar las faqs del knowledgeBaseID
      return this.http.post(environment.api+'/api/requestclin/'+this.authService.getIdUser(), info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    updateRequest(requestId, info){
      //cargar las faqs del knowledgeBaseID
      return this.http.put(environment.api+'/api/requestclin/'+requestId, info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    deleteRequest(requestId){
      return this.http.delete(environment.api+'/api/requestclin/'+requestId)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
    }

    setPosition(lat,lng) {
      var info = { lat: lat, lng: lng };
      return this.http.put(environment.api+'/api/users/location/'+this.authService.getIdUser(), info)
        .map( (res : any) => {
          return res;
         }, (err) => {
           console.log(err);
         })
      //this.user = user;
    }

}
