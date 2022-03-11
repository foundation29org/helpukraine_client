import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CanDeactivateGuard } from 'app/shared/auth/can-deactivate-guard.service';

import { LandPageComponent } from "./land/land-page.component";
import { AboutUsPageComponent } from "./about-us/about-us-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: LandPageComponent,
        data: {
          title: 'Raito'
        },
      },
      {
        path: 'aboutus',
        component: AboutUsPageComponent,
        data: {
          title: 'menu.About us'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
