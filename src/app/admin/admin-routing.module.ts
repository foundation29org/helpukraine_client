import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

import { UsersAdminComponent } from "./users-admin/users-admin.component";
import { SupportComponent } from './support/support.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'users',
        component: UsersAdminComponent,
        data: {
          title: 'Users',
          expectedRole: ['Admin']
        },
        canActivate: [AuthGuard, RoleGuard]
      },
      {
        path: 'support',
        component: SupportComponent,
        data: {
          title: 'Support'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
