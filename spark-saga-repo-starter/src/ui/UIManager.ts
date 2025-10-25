import { InputManager } from '../input/InputManager';
import { Action } from '../input/InputManager';

export class UIManager {
  private container: HTMLElement;
  private header: HTMLElement;
  private main: HTMLElement;
  private footer: HTMLElement;
  private helpDisplay: HTMLElement;
  private logPane: HTMLElement;
  private touchControls: HTMLElement;
  private inputManager: InputManager;

  constructor(inputManager: InputManager) {
    this.container = document.getElementById('ui-container')!;
    this.header = document.getElementById('ui-header')!;
    this.main = document.getElementById('ui-main')!;
    this.footer = document.getElementById('ui-footer')!;
    this.logPane = document.getElementById('log-pane')!;
    this.helpDisplay = document.getElementById('help-display')!;
    this.touchControls = document.getElementById('touch-controls')!;
    this.inputManager = inputManager;

    this.setupTouchControls();
  }

  public updateHelpDisplay(): void {
    const device = this.inputManager.getActiveDevice();
    let helpText = '';
    if (device === 'keyboard') {
      helpText = 'KB: Arrows/WASD, Enter/Space, Esc, M, Q/E';
    } else if (device === 'gamepad') {
      helpText = 'Pad: D-Pad, A, B, Start';
    } else {
      helpText = 'Touch: D-Pad, A, B, M';
    }
    this.helpDisplay.textContent = helpText;
  }

  public log(message: string): void {
    const logEntry = document.createElement('p');
    logEntry.textContent = message;
    this.logPane.appendChild(logEntry);
    this.logPane.scrollTop = this.logPane.scrollHeight;
  }

  private setupTouchControls(): void {
    if ('ontouchstart' in window) {
      this.touchControls.hidden = false;
      this.inputManager.setActiveDevice('touch');
    }

    // D-Pad
    document.getElementById('d-pad-up')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.MoveUp, true));
    document.getElementById('d-pad-up')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.MoveUp, false));
    document.getElementById('d-pad-down')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.MoveDown, true));
    document.getElementById('d-pad-down')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.MoveDown, false));
    document.getElementById('d-pad-left')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.MoveLeft, true));
    document.getElementById('d-pad-left')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.MoveLeft, false));
    document.getElementById('d-pad-right')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.MoveRight, true));
    document.getElementById('d-pad-right')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.MoveRight, false));

    // Action buttons
    document.getElementById('action-confirm')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.Confirm, true));
    document.getElementById('action-confirm')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.Confirm, false));
    document.getElementById('action-cancel')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.Cancel, true));
    document.getElementById('action-cancel')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.Cancel, false));
    document.getElementById('action-menu')!.addEventListener('touchstart', () => this.inputManager.setActionState(Action.Menu, true));
    document.getElementById('action-menu')!.addEventListener('touchend', () => this.inputManager.setActionState(Action.Menu, false));
  }
}
