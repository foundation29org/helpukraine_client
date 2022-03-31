import { Component, ViewChild, OnDestroy, OnInit, ElementRef  } from '@angular/core';
import { environment } from 'environments/environment';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { sha512 } from "js-sha512";
import { AuthService } from '../../../../app/shared/auth/auth.service';
import { AuthGuard } from '../../../../app/shared/auth/auth-guard.service';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';
import { PatientService } from '../../../../app/shared/services/patient.service';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    providers: [PatientService]
})

export class LoginPageComponent implements OnDestroy, OnInit{

    @ViewChild('f') loginForm: NgForm;
    //loginForm: FormGroup;
    sending: boolean = false;

    isBlockedAccount: boolean = false;
    isLoginFailed: boolean = false;
    errorAccountActivated: boolean = false;
    emailResent: boolean = false;
    supportContacted: boolean = false;
    isAccountActivated: boolean = false;
    isActivationPending: boolean = false;
    isBlocked: boolean = false;
    email: string;
    userEmail: string;
    patient: any;
    private subscription: Subscription = new Subscription();
    private subscriptionIntervals: Subscription = new Subscription();
    private subscriptionTestForce: Subscription = new Subscription();
    startTime: Date = null;
    finishTime: Date = null;
    isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";

    constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public authService: AuthService, private authGuard: AuthGuard,  public translate: TranslateService, private patientService: PatientService, private inj: Injector, public toastr: ToastrService) {
      //var param = router.parseUrl(router.url).queryParams["email","key"];
      var param = router.parseUrl(router.url).queryParams;
      if(param.email && param.key){
        //activar la cuenta
        this.subscription.add( this.http.post(environment.api+'/api/activateuser',param)
          .subscribe( (res : any) => {
            if(res.message=='activated'){
              this.isAccountActivated = true;
              this.email = param.email;
              this.loginForm.controls['email'].setValue(param.email);
            }else if(res.message=='error'){
              this.errorAccountActivated = true;
            }
           }, (err) => {
             console.log(err);
             this.errorAccountActivated = true;
           }
         ));

         this.authService.logout()
      }else{
        if(this.authService.getEnvironment()){
          this.translate.use(this.authService.getLang());
          sessionStorage.setItem('lang', this.authService.getLang());
          let url =  this.authService.getRedirectUrl();
          this.router.navigate([ url ]);
        }
      }
     }

     ngOnInit() {
      }

     ngOnDestroy() {
       if(this.subscription) {
            this.subscription.unsubscribe();
        }
       if(this.subscriptionIntervals) {
            this.subscriptionIntervals.unsubscribe();
        }
        if(this.subscriptionTestForce) {
            this.subscriptionTestForce.unsubscribe();
         }
     }

     submitInvalidForm() {
       if (!this.loginForm) { return; }
       const base = this.loginForm;
       for (const field in base.form.controls) {
         if (!base.form.controls[field].valid) {
             base.form.controls[field].markAsTouched()
         }
       }
     }

    // On submit button click
    onSubmit() {
        this.sending = true;
        this.isBlockedAccount = false;
        this.isLoginFailed = false;
        this.isActivationPending = false;
        this.isBlocked = false;
        this.userEmail = this.loginForm.value.email
        this.loginForm.value.password= sha512(this.loginForm.value.password)
    	   this.subscription.add( this.authService.signinUser(this.loginForm.value).subscribe(
    	       authenticated => {
              this.loginForm.reset();
      		    if(authenticated) {
                 //this.translate.setDefaultLang( this.authService.getLang() );
                 this.translate.use(this.authService.getLang());
                 sessionStorage.setItem('lang', this.authService.getLang());
                 this.testHotjarTrigger(this.authService.getLang());
          			 let url =  this.authService.getRedirectUrl();
                 if(this.authService.getRole()=='User'){
                   this.subscription.add( this.patientService.getPatientId()
                   .subscribe( (res : any) => {
                      this.authService.setCurrentPatient(res);
                      this.router.navigate([ url ]);
                     this.sending = false;
                    }, (err) => {
                      console.log(err);
                      this.sending = false;
                    }));
                 }else if(this.authService.getRole()=='Clinical'){
                   this.sending = false;
                    this.router.navigate([ url ]);
                 }
                 else if(this.authService.getRole()=='Admin'){
                  this.sending = false;
                  this.router.navigate([ url ]);
                 }
                 else{
                    this.sending = false;
                   this.router.navigate([ url ]);
                 }

      		    }else {
                this.sending = false;
                let message =  this.authService.getMessage();
                 if(message == "Login failed" || message == "Not found"){
                     this.isLoginFailed = true;
                   }else if(message == "Account is temporarily locked"){
                     this.isBlockedAccount = true;
                   }else if(message == "Account is unactivated"){
                     this.isActivationPending = true;

                    Swal.fire({
                      title: this.translate.instant("login.This account has not been activated yet"),
                      text:this.translate.instant("login.Swal resend email text"),
                      icon: "warning",
                      showCloseButton: true,
                      showConfirmButton: true,
                      showCancelButton: true,
                      focusConfirm: false,
                      confirmButtonText:this.translate.instant("login.resendEmail"),
                      cancelButtonText:this.translate.instant("login.contactSupport"),
                      confirmButtonColor: '#33658a',
                      cancelButtonColor: '#B0B6BB',
                    }).then((result) => {
                      //console.log(result)
                      if (result.value) {
                        //console.log(this.userEmail)
                        var param = {"email": this.userEmail, "lang": this.translate.store.currentLang, "type": "resendEmail"};
                        this.subscription.add( this.http.post(environment.api+'/api/sendEmail',param)
                        .subscribe( (res : any) => {
                          if(res.message=='Email resent'){
                            this.emailResent = true;
                            this.errorAccountActivated = false;
                            this.supportContacted = false
                            this.isActivationPending= false
                          }
                        }, (err) => {
                          console.log(err);
                          this.errorAccountActivated = true;
                        }
                      ));
                    }else{
                      //console.log("support")
                      //console.log(this.userEmail)
                      var param = {"email": this.userEmail, "lang": this.translate.store.currentLang, "type": "contactSupport"};
                      this.subscription.add( this.http.post(environment.api+'/api/sendEmail',param)
                      .subscribe( (res : any) => {
                        if(res.message=='Support contacted'){
                          this.supportContacted = true
                          this.errorAccountActivated = false;
                          this.emailResent = false;
                          this.isActivationPending= false
                        }
                      }, (err) => {
                        console.log(err);
                        this.errorAccountActivated = true;
                      }
                    ));
                    }

                    });

                     //Swal.fire(this.translate.instant("generics.Warning"),this.translate.instant("login.The account is not activated"), "warning");
                   }else if(message == "Account is blocked"){
                     this.isBlocked = true;
                   }else{
                    this.toastr.error('', message);
                  }
      		    }
    	       }
    	   ));
      

    }

    launchDemo(){
      this.loginForm.value.email = 'demo@duchenne.org';
      this.loginForm.value.password = 'dddddddd';
      this.onSubmit();
    }

    // On Forgot password link click
    onForgotPassword() {
        this.router.navigate(['/forgotpassword']);
    }
    // On registration link click
    onRegister() {
        this.router.navigate(['/register']);
    }

    testHotjarTrigger(lang){
      var scenarioHotjar = 'generalincoming_en'
      if(lang=='es'){
        scenarioHotjar = 'generalincoming_es'
      }
      var eventsLang = this.inj.get(EventsService);
      var ojb = {lang: lang, scenario: scenarioHotjar};
      eventsLang.broadcast('changeEscenarioHotjar', ojb);
    }
}
