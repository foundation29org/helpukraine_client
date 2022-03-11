import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClinicalRoutingModule } from '../clinicinfo/clinicinfo-routing.module';
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { UiSwitchModule } from 'ngx-ui-switch';

import {MatSelectModule} from '@angular/material/select';
import {MatExpansionModule} from '@angular/material/expansion';

import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatStepperModule} from '@angular/material/stepper';
import {MatIconModule} from '@angular/material/icon';
import { SymptomsComponent } from './symptoms/symptoms.component';
import { GenotypeComponent } from './genotype/genotype.component';
import { MedicalRecordsComponent } from './medical-records/medical-records.component';
import { CalendarsComponent } from './calendar/calendar.component';
import { MedicationComponent } from './medication/medication.component';
import { AnthropometryComponent } from './anthropometry/anthropometry.component';
import { NgbModalModule, NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomFormsModule } from 'ngx-custom-validators';

import {DndDirective} from "app/shared/directives/dnd.directive";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ClinicalRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        NgxChartsModule,
        UiSwitchModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatStepperModule,
        MatIconModule,
        NgbModalModule,
        NgbDatepickerModule,
        NgbTimepickerModule,
        CustomFormsModule
    ],
    exports: [TranslateModule],
    declarations: [
        SymptomsComponent,
        GenotypeComponent,
        MedicalRecordsComponent,
        CalendarsComponent,
        AnthropometryComponent,
        MedicationComponent,
        DndDirective
    ],
    providers: [],
})
export class ClinicalModule { }
