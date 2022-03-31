import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiExternalServices {

    constructor(private http: HttpClient) {}

    getInfoLocation(){
        return this.http.get('https://ipinfo.io?token=77f94ec6489670')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
