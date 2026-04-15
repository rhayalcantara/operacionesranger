import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="ops-login-scene">
      <!-- Scan-line overlay -->
      <div class="scanlines"></div>

      <!-- Floating grid dots -->
      <div class="grid-field"></div>

      <!-- Main terminal card -->
      <div class="terminal-frame" [class.shake]="loginError">

        <!-- Corner brackets -->
        <span class="bracket tl"></span>
        <span class="bracket tr"></span>
        <span class="bracket bl"></span>
        <span class="bracket br"></span>

        <!-- Shield emblem -->
        <div class="emblem-row">
          <div class="shield-wrap">
            <svg class="shield-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4L8 16V30C8 46 18 56 32 60C46 56 56 46 56 30V16L32 4Z"
                    stroke="var(--accent)" stroke-width="2" fill="none" class="shield-path"/>
              <path d="M32 14L16 22V32C16 42 22 48 32 52C42 48 48 42 48 32V22L32 14Z"
                    fill="var(--accent-dim)" class="shield-inner"/>
              <path d="M28 34L24 30L22 32L28 38L42 24L40 22L28 34Z"
                    fill="var(--accent)" class="shield-check"/>
            </svg>
            <div class="radar-sweep"></div>
          </div>
        </div>

        <!-- Header text -->
        <div class="terminal-header">
          <h1 class="sys-title">OPERACIONES<span class="accent">RANGER</span></h1>
          <div class="subtitle-line">
            <span class="dash-decor">///</span>
            <span class="subtitle-text">SISTEMA DE GESTI&Oacute;N DE TURNOS</span>
            <span class="dash-decor">///</span>
          </div>
          <p class="org-name">GUARDIANES PROFESIONALES &mdash; REP. DOMINICANA</p>
        </div>

        <!-- Divider -->
        <div class="hz-line">
          <span class="line-dot"></span>
        </div>

        <!-- Auth label -->
        <div class="auth-label">
          <mat-icon class="label-icon">verified_user</mat-icon>
          <span>AUTENTICACI&Oacute;N REQUERIDA</span>
        </div>

        <!-- Login form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="ops-form">
          <div class="field-row">
            <span class="field-prefix-icon material-icons">person_outline</span>
            <mat-form-field appearance="outline" class="ops-field">
              <mat-label>Operador</mat-label>
              <input
                matInput
                formControlName="username"
                placeholder="usuario"
                autocomplete="username"
                spellcheck="false"
                required>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                Campo requerido
              </mat-error>
            </mat-form-field>
          </div>

          <div class="field-row">
            <span class="field-prefix-icon material-icons">lock_outline</span>
            <mat-form-field appearance="outline" class="ops-field">
              <mat-label>Clave de Acceso</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                autocomplete="current-password"
                required>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="'Mostrar clave'"
                class="toggle-vis">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Campo requerido
              </mat-error>
            </mat-form-field>
          </div>

          <button
            mat-flat-button
            type="submit"
            class="ops-submit"
            [disabled]="loginForm.invalid || isLoading">
            <mat-spinner *ngIf="isLoading" diameter="18" class="btn-spinner"></mat-spinner>
            <span class="btn-label">{{isLoading ? 'VERIFICANDO...' : 'INGRESAR AL SISTEMA'}}</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="terminal-footer">
          <span class="status-dot" [class.online]="!isLoading" [class.busy]="isLoading"></span>
          <span class="footer-text">TERMINAL SEGURO &mdash; v1.0</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;500;600;700&display=swap');

    :host {
      --bg-deep:    #060a14;
      --bg-surface: #0c1220;
      --bg-card:    #0f1628;
      --bg-input:   #0a0f1c;
      --border:     #1c2a45;
      --border-hi:  #2a3d65;
      --text:       #c8d6e5;
      --text-dim:   #5a6a80;
      --text-muted: #3a4a5e;
      --accent:     #00d4ff;
      --accent-dim: rgba(0, 212, 255, 0.08);
      --accent-glow:rgba(0, 212, 255, 0.25);
      --warn:       #ff9500;
      --danger:     #ff3b30;
      --success:    #30d158;

      display: block;
      width: 100%;
      height: 100%;
    }

    /* ========== SCENE ========== */

    .ops-login-scene {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 30% 20%, rgba(0, 60, 120, 0.15) 0%, transparent 60%),
        radial-gradient(ellipse at 70% 80%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
        var(--bg-deep);
      padding: 20px;
      position: relative;
      overflow: hidden;
      font-family: 'Share Tech Mono', 'Courier New', monospace;
    }

    /* Scan-line overlay */
    .scanlines {
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.03) 2px,
        rgba(0, 0, 0, 0.03) 4px
      );
      pointer-events: none;
      z-index: 1;
    }

    /* Grid dots background */
    .grid-field {
      position: fixed;
      inset: 0;
      background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
      background-size: 40px 40px;
      opacity: 0.3;
      pointer-events: none;
      z-index: 0;
    }

    /* ========== TERMINAL FRAME ========== */

    .terminal-frame {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 440px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 40px 36px 28px;
      box-shadow:
        0 0 0 1px var(--border),
        0 4px 40px rgba(0, 0, 0, 0.5),
        0 0 120px rgba(0, 212, 255, 0.03);
      animation: terminalIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes terminalIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .terminal-frame.shake {
      animation: shakeError 0.4s ease-in-out;
    }

    @keyframes shakeError {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }

    /* Corner brackets */
    .bracket {
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: var(--accent);
      border-style: solid;
      border-width: 0;
      opacity: 0;
      animation: bracketIn 0.3s ease forwards;
    }
    .bracket.tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; animation-delay: 0.4s; }
    .bracket.tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; animation-delay: 0.5s; }
    .bracket.bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; animation-delay: 0.6s; }
    .bracket.br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; animation-delay: 0.7s; }

    @keyframes bracketIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ========== SHIELD EMBLEM ========== */

    .emblem-row {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
      animation: fadeUp 0.5s 0.2s ease both;
    }

    .shield-wrap {
      position: relative;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shield-icon {
      width: 56px;
      height: 56px;
      filter: drop-shadow(0 0 12px var(--accent-glow));
    }

    .shield-path {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: drawShield 1.2s 0.6s ease forwards;
    }

    @keyframes drawShield {
      to { stroke-dashoffset: 0; }
    }

    .shield-inner {
      opacity: 0;
      animation: fadeIn 0.4s 1.4s ease forwards;
    }

    .shield-check {
      opacity: 0;
      animation: fadeIn 0.3s 1.6s ease forwards;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    .radar-sweep {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      border: 1px solid transparent;
      border-top-color: var(--accent);
      opacity: 0.4;
      animation: radarSpin 3s linear infinite;
    }

    @keyframes radarSpin {
      to { transform: rotate(360deg); }
    }

    /* ========== HEADER ========== */

    .terminal-header {
      text-align: center;
      margin-bottom: 24px;
      animation: fadeUp 0.5s 0.3s ease both;
    }

    .sys-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 700;
      font-size: 28px;
      letter-spacing: 6px;
      color: var(--text);
      margin: 0 0 8px;
      text-transform: uppercase;
    }

    .sys-title .accent {
      color: var(--accent);
    }

    .subtitle-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .dash-decor {
      color: var(--accent);
      font-size: 11px;
      opacity: 0.5;
      letter-spacing: 2px;
    }

    .subtitle-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 500;
      font-size: 12px;
      letter-spacing: 3px;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .org-name {
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--text-muted);
      margin: 6px 0 0;
      text-transform: uppercase;
    }

    /* ========== DIVIDER ========== */

    .hz-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-hi) 30%, var(--border-hi) 70%, transparent);
      margin: 0 0 20px;
      position: relative;
      display: flex;
      justify-content: center;
      animation: fadeUp 0.5s 0.35s ease both;
    }

    .line-dot {
      width: 6px;
      height: 6px;
      background: var(--accent);
      border-radius: 50%;
      position: absolute;
      top: -2.5px;
      box-shadow: 0 0 8px var(--accent-glow);
    }

    /* ========== AUTH LABEL ========== */

    .auth-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      animation: fadeUp 0.5s 0.4s ease both;
    }

    .auth-label .label-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--warn);
    }

    .auth-label span {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 3px;
      color: var(--warn);
      text-transform: uppercase;
    }

    /* ========== FORM ========== */

    .ops-form {
      animation: fadeUp 0.5s 0.5s ease both;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ========== FIELD ROW (icon + field) ========== */

    .field-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .field-prefix-icon {
      font-size: 22px;
      color: var(--text-muted);
      margin-top: 16px;
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .field-row:focus-within .field-prefix-icon {
      color: var(--accent);
    }

    .ops-field {
      width: 100%;
      flex: 1;
    }

    /* Material field overrides */
    :host ::ng-deep .ops-field .mat-mdc-text-field-wrapper {
      background: var(--bg-input) !important;
      border-radius: 0 !important;
    }

    :host ::ng-deep .ops-field .mdc-notched-outline__leading,
    :host ::ng-deep .ops-field .mdc-notched-outline__notch,
    :host ::ng-deep .ops-field .mdc-notched-outline__trailing {
      border-color: var(--border) !important;
      border-radius: 0 !important;
    }

    :host ::ng-deep .ops-field.mat-focused .mdc-notched-outline__leading,
    :host ::ng-deep .ops-field.mat-focused .mdc-notched-outline__notch,
    :host ::ng-deep .ops-field.mat-focused .mdc-notched-outline__trailing {
      border-color: var(--accent) !important;
    }

    :host ::ng-deep .ops-field .mat-mdc-form-field-focus-overlay {
      background: transparent !important;
    }

    :host ::ng-deep .ops-field .mdc-floating-label {
      font-family: 'Barlow Condensed', sans-serif !important;
      font-weight: 500 !important;
      letter-spacing: 1.5px !important;
      font-size: 13px !important;
      text-transform: uppercase !important;
      color: var(--text-dim) !important;
    }

    :host ::ng-deep .ops-field.mat-focused .mdc-floating-label {
      color: var(--accent) !important;
    }

    :host ::ng-deep .ops-field .mat-mdc-input-element {
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 14px !important;
      color: var(--text) !important;
      letter-spacing: 1px !important;
    }

    :host ::ng-deep .ops-field .mat-mdc-input-element::placeholder {
      color: var(--text-muted) !important;
      opacity: 1 !important;
    }

    .toggle-vis {
      color: var(--text-muted) !important;
    }
    .toggle-vis:hover {
      color: var(--accent) !important;
    }

    :host ::ng-deep .ops-field .mat-mdc-form-field-error {
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 11px !important;
      color: var(--danger) !important;
    }

    /* ========== SUBMIT BUTTON ========== */

    .ops-submit {
      width: 100%;
      height: 48px;
      margin-top: 12px;
      background: linear-gradient(135deg, #0a2a4a 0%, #0d1f35 100%) !important;
      border: 1px solid var(--accent) !important;
      border-radius: 0 !important;
      color: var(--accent) !important;
      font-family: 'Barlow Condensed', sans-serif !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      letter-spacing: 4px !important;
      text-transform: uppercase !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 10px !important;
      transition: all 0.25s ease !important;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .ops-submit::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, var(--accent-dim), transparent);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }

    .ops-submit:hover:not(:disabled)::before {
      transform: translateX(100%);
    }

    .ops-submit:hover:not(:disabled) {
      background: linear-gradient(135deg, #0d3560 0%, #0f2845 100%) !important;
      box-shadow: 0 0 20px var(--accent-glow), inset 0 0 20px rgba(0, 212, 255, 0.05) !important;
    }

    .ops-submit:disabled {
      opacity: 0.35 !important;
      border-color: var(--border) !important;
      color: var(--text-muted) !important;
      cursor: not-allowed;
    }

    .btn-spinner {
      display: inline-flex !important;
    }

    :host ::ng-deep .btn-spinner circle {
      stroke: var(--accent) !important;
    }

    .btn-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .btn-label {
      position: relative;
      z-index: 1;
    }

    /* ========== FOOTER ========== */

    .terminal-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      animation: fadeUp 0.5s 0.6s ease both;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      transition: background 0.3s ease;
    }

    .status-dot.online {
      background: var(--success);
      box-shadow: 0 0 6px rgba(48, 209, 88, 0.5);
      animation: pulse 2s ease infinite;
    }

    .status-dot.busy {
      background: var(--warn);
      box-shadow: 0 0 6px rgba(255, 149, 0, 0.5);
      animation: pulse 0.8s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .footer-text {
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    /* ========== RESPONSIVE ========== */

    @media (max-width: 480px) {
      .terminal-frame {
        padding: 28px 20px 20px;
      }

      .sys-title {
        font-size: 22px;
        letter-spacing: 4px;
      }

      .subtitle-text {
        font-size: 10px;
        letter-spacing: 2px;
      }

      .shield-wrap {
        width: 60px;
        height: 60px;
      }

      .shield-icon {
        width: 46px;
        height: 46px;
      }

      .ops-submit {
        letter-spacing: 2px !important;
        font-size: 13px !important;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  loginError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = false;
    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showMessage('Acceso autorizado', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.triggerShake();
        const errorMessage = error?.error?.message || 'Credenciales inv\u00e1lidas. Acceso denegado.';
        this.showMessage(errorMessage, 'error');
        this.loginForm.patchValue({ password: '' });
      }
    });
  }

  private triggerShake(): void {
    this.loginError = true;
    setTimeout(() => this.loginError = false, 500);
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'success' ? 3000 : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }
}
