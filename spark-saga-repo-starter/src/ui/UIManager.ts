import { Combatant } from '../combat/Combatant';
import { InputManager } from '../input/InputManager';
import { Action } from '../input/InputManager';
import { ConversationManager } from '../managers/ConversationManager';
import { EventNode } from '../schemas/event';

export class UIManager {
  private container: HTMLElement | null;
  private header: HTMLElement | null;
  private main: HTMLElement | null;
  private footer: HTMLElement | null;
  private helpDisplay: HTMLElement | null;
  private logPane: HTMLElement | null;
  private touchControls: HTMLElement | null;
  private conversationOverlay: HTMLElement | null;
  private dialogBox: HTMLElement | null;
  private dialogText: HTMLElement | null;
  private choiceList: HTMLElement | null;
  private playerStatus: HTMLElement | null;
  private enemyStatus: HTMLElement | null;
  private inputManager: InputManager;
  private conversationManager: ConversationManager;
  private conversationHistory: string[] = [];

  constructor(inputManager: InputManager, conversationManager: ConversationManager) {
    this.container = this.getElementById('ui-container');
    this.header = this.getElementById('ui-header');
    this.main = this.getElementById('ui-main');
    this.footer = this.getElementById('ui-footer');
    this.logPane = this.getElementById('log-pane');
    this.helpDisplay = this.getElementById('help-display');
    this.touchControls = this.getElementById('touch-controls');
    this.conversationOverlay = this.getElementById('conversation-overlay');
    this.dialogBox = this.getElementById('dialog-box');
    this.dialogText = this.getElementById('dialog-text');
    this.choiceList = this.getElementById('choice-list');
    this.playerStatus = this.getElementById('player-status');
    this.enemyStatus = this.getElementById('enemy-status');
    this.inputManager = inputManager;
    this.conversationManager = conversationManager;

    this.setupTouchControls();

    if (this.dialogBox) {
      this.dialogBox.addEventListener('click', () => {
        if (this.conversationManager.currentNode?.type === 'dialog') {
          this.conversationManager.next();
        }
      });
    }
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
    if (!this.helpDisplay) {
      console.warn('[UIManager] Help display element is missing.');
      return;
    }
    this.helpDisplay.textContent = helpText;
  }

  public log(message: string): void {
    if (!this.logPane) {
      console.warn('[UIManager] Log pane element is missing.');
      return;
    }
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
    if (!this.conversationOverlay || !this.dialogText || !this.choiceList) {
      console.warn('[UIManager] Conversation elements are missing.');
      return;
    }
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
    if (!this.conversationOverlay) {
      console.warn('[UIManager] Conversation overlay element is missing.');
      return;
    }
    this.conversationOverlay.hidden = true;
  }

  public updatePartyStatus(player: Combatant, enemy: Combatant): void {
    if (!this.playerStatus || !this.enemyStatus) {
      console.warn('[UIManager] Status panel elements are missing.');
      return;
    }

    this.playerStatus.innerHTML = `<strong>Player</strong><span>HP ${player.hp}/${player.maxHp} | LP ${player.lp}/${player.maxLp} | WP ${player.wp}/${player.maxWp} | JP ${player.jp}/${player.maxJp}</span><span class="status-effects">${this.getStatusEffectIcons(player)}</span>`;
    this.enemyStatus.innerHTML = `<strong>Enemy</strong><span>HP ${enemy.hp}/${enemy.maxHp} | LP ${enemy.lp}/${enemy.maxLp} | WP ${enemy.wp}/${enemy.maxWp} | JP ${enemy.jp}/${enemy.maxJp}</span><span class="status-effects">${this.getStatusEffectIcons(enemy)}</span>`;
  }

  private getStatusEffectIcons(combatant: Combatant): string {
    return combatant.statusEffects.map(effect =>
      `<span class="status-effect-icon" title="${effect.definition.name} (${effect.duration})">${effect.definition.id.substring(0, 2).toUpperCase()}</span>`
    ).join(' ');
  }

  private setupTouchControls(): void {
    const touchControls = this.touchControls;
    if (!touchControls) {
      console.warn('[UIManager] Touch controls container is missing.');
      return;
    }

    if ('ontouchstart' in window) {
      touchControls.hidden = false;
      this.inputManager.setActiveDevice('touch');
    }

    // D-Pad
    this.bindTouchControlButton('d-pad-up', Action.MoveUp);
    this.bindTouchControlButton('d-pad-down', Action.MoveDown);
    this.bindTouchControlButton('d-pad-left', Action.MoveLeft);
    this.bindTouchControlButton('d-pad-right', Action.MoveRight);

    // Action buttons
    this.bindTouchControlButton('action-confirm', Action.Confirm);
    this.bindTouchControlButton('action-cancel', Action.Cancel);
    this.bindTouchControlButton('action-menu', Action.Menu);
  }

  private getElementById<T extends HTMLElement>(id: string): T | null {
    const element = document.getElementById(id) as T | null;
    if (!element) {
      console.warn(`[UIManager] Element with id "${id}" was not found.`);
    }
    return element;
  }

  private bindTouchControlButton(id: string, action: Action): void {
    const button = this.getElementById<HTMLButtonElement>(id);
    if (!button) {
      console.warn(`[UIManager] Touch control button "${id}" is missing.`);
      return;
    }
    button.addEventListener('touchstart', () => this.inputManager.setActionState(action, true));
    button.addEventListener('touchend', () => this.inputManager.setActionState(action, false));
  }
}
