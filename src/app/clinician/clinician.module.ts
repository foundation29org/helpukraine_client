import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClinicianRoutingModule } from "./clinician-routing.module";

import { CustomFormsModule } from 'ngx-custom-validators';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import {MatSelectModule} from '@angular/material/select';
import {MatRadioModule} from '@angular/material/radio';
import { TagInputModule } from 'ngx-chips';
import { UiSwitchModule } from 'ngx-ui-switch';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AgmCoreModule } from '@agm/core';

import { HomeComponent } from './home/home.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import {AutosizeModule} from 'ngx-autosize';


@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ClinicianRoutingModule,
        FormsModule,
        CustomFormsModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        MatSelectModule,
        MatRadioModule,
        TagInputModule,
        ReactiveFormsModule,
        UiSwitchModule,
        MatDatepickerModule,
        MatNativeDateModule,
        AgmCoreModule.forRoot({
            apiKey: "AIzaSyAcbDF_C9btRGAUWSePhOR4UxsVbtK3cJA",
            language: sessionStorage && sessionStorage.getItem('lang') || 'en'
          }),
        NgxChartsModule,
        MatCheckboxModule,
        NgxSliderModule,
        AutosizeModule
    ],
    declarations: [
        HomeComponent
    ]
})
export class ClinicianModule { }
