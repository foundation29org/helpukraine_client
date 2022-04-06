import { RouteInfo } from './sidebar.metadata';

//Sidebar menu Routes and data
export const ROUTES: RouteInfo[] = [

    { path: '/home', title: 'menu.Dashboard', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESCLINICAL: RouteInfo[] = [

    { path: '/clinical/dashboard/home', title: 'diagnosis.Cases', icon: 'ft-users', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/pages/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/clinical/about', title: 'about.title', icon: 'ft-book', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/pages/profile', title: 'navbar.My Profile', icon: 'ft-edit', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    //{ path: '/privacy-policy', title: 'registration.Privacy Policy', icon: 'ft-shield', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESSUPERADMIN: RouteInfo[] = [

    { path: '/superadmin/dashboard-superadmin', title: 'menu.Dashboard Super Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/superadmin/langs', title: 'menu.Languages', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/translations', title: 'menu.Translations', icon: 'ft-flag', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/diagnosis-super-admin', title: 'diagnosis.Diagnosis powered by genes', icon: 'ft-navigation', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
    { path: '/superadmin/support', title: 'support.support', icon: 'ft-mail', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] },
];

export const ROUTESADMINGTP: RouteInfo[] = [
    { path: '/admin/dashboard/admingtp', title: 'menu.Dashboard Super Admin', icon: 'ft-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
];

//Sidebar menu Routes and data
export const ROUTESHOMEDX: RouteInfo[] = [
    { path: '/.', title: 'Home', icon: 'icon-home', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
    { path: '/aboutus', title: 'menu.About us', icon: 'fas fa-info', class: '', badge: '', badgeClass: 'badge badge-pill badge-danger float-right mr-1 mt-1', isExternalLink: false, submenu: [] },
];
