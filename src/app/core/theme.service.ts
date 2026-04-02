import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'theme';
const LIGHT_THEME_HREF = 'assets/primeng-themes/lara-light-blue/theme.css';
const DARK_THEME_HREF = 'assets/primeng-themes/lara-dark-blue/theme.css';
const LIGHT_PRIMARY = '#3b82f6';
const LIGHT_PRIMARY_RGB = '59, 130, 246';
const DARK_PRIMARY = '#60a5fa';
const DARK_PRIMARY_RGB = '96, 165, 250';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly themeSubject = new BehaviorSubject<ThemeMode>('light');
  readonly theme$ = this.themeSubject.asObservable();
  get currentTheme(): ThemeMode {
    return this.themeSubject.value;
  }
  init(): void { this.applyTheme(this.getInitialTheme(), false);}
  toggle(): void { this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');  }
  setTheme(theme: ThemeMode): void { this.applyTheme(theme, true);}

  private getInitialTheme(): ThemeMode {
    const stored = this.safeGetStoredTheme();
    if (stored) return stored;

    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }
  private safeGetStoredTheme(): ThemeMode | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (value === 'light' || value === 'dark') return value;
      return null;
    } catch {
      return null;
    }
  }
  private applyTheme(theme: ThemeMode, persist: boolean): void {
    this.themeSubject.next(theme);
    const root = this.document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    root.style.setProperty('--bs-primary', theme === 'dark' ? DARK_PRIMARY : LIGHT_PRIMARY);
    root.style.setProperty('--bs-primary-rgb', theme === 'dark' ? DARK_PRIMARY_RGB : LIGHT_PRIMARY_RGB);
    const themeLink = this.document.getElementById('primeng-theme') as HTMLLinkElement | null;
    if (themeLink) themeLink.href = theme === 'dark' ? DARK_THEME_HREF : LIGHT_THEME_HREF;
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { }
  }
}