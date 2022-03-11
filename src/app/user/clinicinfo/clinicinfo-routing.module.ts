import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { SymptomsComponent } from './symptoms/symptoms.component';
import { GenotypeComponent } from './genotype/genotype.component';
import { MedicalRecordsComponent } from './medical-records/medical-records.component';
import { CalendarsComponent } from './calendar/calendar.component';
import { MedicationComponent } from './medication/medication.component';
import { AnthropometryComponent } from './anthropometry/anthropometry.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'symptoms',
        component: SymptomsComponent,
        data: {
          title: 'menu.Phenotype',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'genotype',
        component: GenotypeComponent,
        data: {
          title: 'menu.Genotype',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'medical-records',
        component: MedicalRecordsComponent,
        data: {
          title: 'menu.Clinical information',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'seizures',
        component: CalendarsComponent,
        data: {
          title: 'menu.Seizures',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'medication',
        component: MedicationComponent,
        data: {
          title: 'clinicalinfo.Medication',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'anthropometry',
        component: AnthropometryComponent,
        data: {
          title: 'clinicalinfo.Anthropometry',
          expectedRole: ['User']
        },
        canActivate: [AuthGuard, RoleGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClinicalRoutingModule { }
