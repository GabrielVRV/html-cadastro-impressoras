import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'impressoras' },
  {
    path: 'impressoras',
    title: 'Impressoras',
    loadComponent: () =>
      import('./features/impressoras/impressoras.page').then((m) => m.ImpressorasPage),
  },
  { path: '**', redirectTo: 'impressoras' },
];
