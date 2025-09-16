import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success message with green background
   */
  success(message: string, duration: number = 4000): MatSnackBarRef<any> {
    return this.snackBar.open(message, undefined, {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show error message with red background
   */
  error(message: string, duration: number = 4000): MatSnackBarRef<any> {
    return this.snackBar.open(message, undefined, {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show info message with blue background
   */
  info(message: string, duration: number = 4000): MatSnackBarRef<any> {
    return this.snackBar.open(message, undefined, {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show warning message with orange background
   */
  warning(message: string, duration: number = 4000): MatSnackBarRef<any> {
    return this.snackBar.open(message, undefined, {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Show custom snackbar with custom configuration
   */
  show(message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef<any> {
    return this.snackBar.open(message, action, config);
  }

  /**
   * Dismiss all active snackbars
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}