import { Component, OnInit, OnDestroy, LOCALE_ID, AfterViewChecked} from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { HighlightService } from 'app/shared/services/highlight.service';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TermsConditionsPageComponent } from "../terms-conditions/terms-conditions-page.component";

export function getCulture() {
  return sessionStorage.getItem('culture');
}

@Component({
  selector: 'app-pre-register-page',
  templateUrl: './pre-register-page.component.html',
  styleUrls: ['./pre-register-page.component.scss'],
  providers: [{ provide: LOCALE_ID, useFactory: getCulture }, NgbCarouselConfig]

})

export class PreRegisterPageComponent implements OnDestroy, OnInit, AfterViewChecked {

  private subscription: Subscription = new Subscription();
  highlighted: boolean = false;
  openedTerms: boolean = false;
  role: string = 'Clinical';
  subrole: string = 'null';
  constructor(private router: Router, private http: HttpClient, public translate: TranslateService, config: NgbCarouselConfig, private highlightService: HighlightService, private modalService: NgbModal) {
    //customize default values of carousels used by this component tree
    config.interval = 100000;
    config.wrap = false;
    config.keyboard = true;
    config.pauseOnHover = false;
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    
  }

  ngAfterViewChecked() {
    this.highlightService.highlightAll();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  openTerms() {
    this.openedTerms = true;
    let ngbModalOptions: NgbModalOptions = {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'
    };
    const modalRef = this.modalService.open(TermsConditionsPageComponent, ngbModalOptions);
    modalRef.componentInstance.role = this.role;
    modalRef.componentInstance.subrole = this.subrole;
  }




}
