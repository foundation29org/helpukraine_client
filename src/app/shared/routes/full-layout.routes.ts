import { Routes, RouterModule } from '@angular/router';
import { RoleGuard } from 'app/shared/auth/role-guard.service';

//Route for content layout with sidebar, navbar and footer
export const Full_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('../../user/user.module').then(m => m.UserModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['User'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('../../admin/admin.module').then(m => m.AdminModule),
    canActivate: [RoleGuard],
    data: { expectedRole: ['Admin'] }
  },
  {
    path: 'pages',
    loadChildren: () => import('../../pages/full-pages/full-pages.module').then(m => m.FullPagesModule)
  }
];
