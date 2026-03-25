import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb py-2 px-0 mb-0 bg-transparent">
        <li class="breadcrumb-item d-flex align-items-center">
          <a routerLink="/admin/dashboard" class="text-primary text-decoration-none d-flex align-items-center">
            <i class="bi bi-house-door me-1"></i>
            <span class="small fw-medium"> Accueil </span>
          </a>
        </li>
        <li
          class="breadcrumb-item d-flex align-items-center"
          *ngFor="let item of breadcrumbs; let last = last"
          [class.active]="last"
          [attr.aria-current]="last ? 'page' : null"
        >
          <a *ngIf="!last && item.link" [routerLink]="item.link" class="text-primary text-decoration-none small fw-medium">
            {{ item.label }}
          </a>
          <span *ngIf="last || !item.link" class="text-secondary small fw-medium">{{ item.label }}</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-item + .breadcrumb-item::before {
      content: "\F285"; /* bi-chevron-right */
      font-family: "bootstrap-icons";
      font-size: 0.65rem;
      color: #94a3b8;
      vertical-align: middle;
      padding-top: 2px;
    }
    .breadcrumb-item.active {
      color: #64748b;
    }
  `]
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  @Input() items: { label: string; link?: string }[] = [];

  breadcrumbs: { label: string; link?: string }[] = [];
  private sub?: Subscription;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());

    // Initial render
    this.updateBreadcrumbs();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateBreadcrumbs(): void {
    if (this.items?.length) {
      this.breadcrumbs = this.items;
      return;
    }

    const breadcrumbs: { label: string; link?: string }[] = [];
    let currentRoute: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (currentRoute) {
      const children: ActivatedRoute[] = currentRoute.children;
      if (!children || children.length === 0) {
        break;
      }

      const child: ActivatedRoute = children[0];
      const routeConfig = child.routeConfig;

      if (routeConfig && routeConfig.path) {
        const routeURL = routeConfig.path;
        const routeDataLabel = (routeConfig.data as any)?.['breadcrumb'] as string | undefined;
        url += `/${routeURL}`;

        if (routeDataLabel) {
          breadcrumbs.push({ label: routeDataLabel, link: url });
        } else {
          // fallback to path segment
          const label = routeURL
            .split('/')
            .filter((p: string) => p.length > 0)
            .pop()
            ?.replace(/-/g, ' ');
          if (label) {
            breadcrumbs.push({ label: label.charAt(0).toUpperCase() + label.slice(1), link: url });
          }
        }
      }

      currentRoute = child;
    }
    this.breadcrumbs = breadcrumbs;
  }
}
// import { Component, Input } from '@angular/core';

// @Component({
//   selector: 'app-breadcrumb',
//   template: `
//     <nav aria-label="breadcrumb" class="mb-4">
//       <ol class="breadcrumb bg-white p-3 rounded shadow-sm border-0">
//         <li class="breadcrumb-item"><a routerLink="/admin/dashboard" class="text-decoration-none"><i class="bi bi-house-door me-1"></i>Home</a></li>
//         <li *ngFor="let item of items; let last = last" class="breadcrumb-item" [class.active]="last" [attr.aria-current]="last ? 'page' : null">
//           <a *ngIf="!last" [routerLink]="item.link" class="text-decoration-none">{{ item.label }}</a>
//           <span *ngIf="last">{{ item.label }}</span>
//         </li>
//       </ol>
//     </nav>
//   `,
//   styles: [`
//     .breadcrumb-item + .breadcrumb-item::before {
//       content: "\F285";
//       font-family: "bootstrap-icons";
//       font-size: 0.8rem;
//     }
//   `]
// })
// export class BreadcrumbComponent {
//   @Input() items: { label: string, link?: string }[] = [];
// }
