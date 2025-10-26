import { InputManager } from '../input/InputManager';
import { Action } from '../input/InputManager';
import { ConversationManager } from '../managers/ConversationManager';
import { EventNode } from '../schemas/event';

export class UIManager {
  private container: HTMLElement;
  private header: HTMLElement;
  private main: HTMLElement;
  private footer: HTMLElement;
  private helpDisplay: HTMLElement;
  private logPane: HTMLElement;
  private touchControls: HTMLElement;
  private conversationOverlay: HTMLElement;
  private dialogBox: HTMLElement;
  private dialogText: HTMLElement;
  private choiceList: HTMLElement;
  private inputManager: InputManager;
  private conversationManager: ConversationManager;
  private conversationHistory: string[] = [];

  constructor(inputManager: InputManager, conversationManager: ConversationManager) {
    this.container = document.getElementById('ui-container')!;
    this.header = document.getElementById('ui-header')!;
    this.main = document.getElementById('ui-main')!;
    this.footer = document.getElementById('ui-footer')!;
    this.logPane = document.getElementById('log-pane')!;
    this.helpDisplay = document.getElementById('help-display')!;
    this.touchControls = document.getElementById('touch-controls')!;
    this.conversationOverlay = document.getElementById('conversation-overlay')!;
    this.dialogBox = document.getElementById('dialog-box')!;
    this.dialogText = document.getElementById('dialog-text')!;
    this.choiceList = document.getElementById('choice-list')!;
    this.inputManager = inputManager;
    this.conversationManager = conversationManager;

    this.setupTouchControls();

    this.dialogBox.addEventListener('click', () => {
      if (this.conversationManager.currentNode?.type === 'dialog') {
        this.conversationManager.next();
      }
    });
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

    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift();
    }
  }

  public showConversation(node: EventNode) {
    this.conversationOverlay.hidden = false;
    if (node.type === 'dialog') {
      this.dialogText.textContent = node.text; // This should be an i18n key
      this.choiceList.innerHTML = '';
    } else if (node.type === 'choice') {
      this.dialogText.textContent = ''; // Or some prompt
      this.choiceList.innerHTML = '';
      node.choices.forEach((choice, index) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = choice.text; // i18n key
        button.onclick = () => this.conversationManager.handleChoice(index);
        li.appendChild(button);
        this.choiceList.appendChild(li);
      });
    }
  }

  public hideConversation() {
    this.conversationOverlay.hidden = true;
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
