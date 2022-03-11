import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserRoutingModule } from "./user-routing.module";

import { CustomFormsModule } from 'ngx-custom-validators';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import {MatSelectModule} from '@angular/material/select';
import { TagInputModule } from 'ngx-chips';
import { UiSwitchModule } from 'ngx-ui-switch';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { HomeComponent } from './home/home.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { FeelComponent } from './feel/feel.component';
import { PromComponent } from './prom/prom.component';
import { ComboChartComponent, ComboSeriesVerticalComponent } from './home/combo-chart';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { NgxSliderModule } from '@angular-slider/ngx-slider';


@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        UserRoutingModule,
        FormsModule,
        CustomFormsModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        MatSelectModule,
        TagInputModule,
        ReactiveFormsModule,
        UiSwitchModule,
        MatDatepickerModule,
        MatNativeDateModule,
        NgxChartsModule,
        MatCheckboxModule,
        NgxSliderModule
    ],
    declarations: [
        HomeComponent,
        PersonalInfoComponent,
        FeelComponent,
        PromComponent,
        ComboChartComponent,
        ComboSeriesVerticalComponent
    ]
})
export class UserModule { }
