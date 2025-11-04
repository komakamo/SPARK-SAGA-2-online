import { Combatant } from '../combat/Combatant';
import { InputManager } from '../input/InputManager';
import { Action } from '../input/InputManager';
import { ConversationManager } from '../managers/ConversationManager';
import { EventNode } from '../schemas/event';

export interface BattleMenuOption {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

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
  private commandMenu: HTMLElement | null;
  private skillMenu: HTMLElement | null;
  private targetMenu: HTMLElement | null;
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
    this.commandMenu = this.getElementById('command-menu');
    this.skillMenu = this.getElementById('skill-menu');
    this.targetMenu = this.getElementById('target-menu');
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

  public updateBattleStatus(allies: Combatant[], enemies: Combatant[]): void {
    if (!this.playerStatus || !this.enemyStatus) {
      console.warn('[UIManager] Status panel elements are missing.');
      return;
    }

    this.renderCombatantStatusPanel(this.playerStatus, 'Party', allies);
    this.renderCombatantStatusPanel(this.enemyStatus, 'Enemies', enemies);
  }

  private renderCombatantStatusPanel(container: HTMLElement, label: string, members: Combatant[]): void {
    container.innerHTML = '';
    const heading = document.createElement('h2');
    heading.textContent = label;
    container.appendChild(heading);

    const list = document.createElement('ul');
    list.classList.add('status-list');

    members.forEach((member) => {
      const item = document.createElement('li');
      item.classList.add('status-entry');
      const name = document.createElement('strong');
      name.textContent = this.getCombatantLabel(member);
      const vitals = document.createElement('span');
      vitals.textContent = `HP ${member.hp}/${member.maxHp} | LP ${member.lp}/${member.maxLp} | WP ${member.wp}/${member.maxWp} | JP ${member.jp}/${member.maxJp}`;
      const effects = document.createElement('span');
      effects.classList.add('status-effects');
      effects.innerHTML = this.getStatusEffectIcons(member);

      item.appendChild(name);
      item.appendChild(vitals);
      item.appendChild(effects);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  private getCombatantLabel(combatant: Combatant): string {
    return combatant.name ?? 'Unknown';
  }

  private getStatusEffectIcons(combatant: Combatant): string {
    if (combatant.statusEffects.length === 0) {
      return '<span>-</span>';
    }
    return combatant.statusEffects
      .map(
        effect =>
          `<span class="status-effect-icon" title="${effect.definition.name} (${effect.duration})">${effect.definition.id
            .substring(0, 2)
            .toUpperCase()}</span>`,
      )
      .join(' ');
  }

  public renderBattleMenu(
    menu: 'command' | 'skill' | 'target',
    options: BattleMenuOption[],
    selectedIndex: number,
    title: string,
  ): void {
    const container = this.getMenuContainer(menu);
    if (!container) {
      return;
    }

    container.hidden = false;
    container.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = title;
    container.appendChild(heading);

    const list = document.createElement('ul');
    options.forEach((option, index) => {
      const item = document.createElement('li');
      const button = document.createElement('div');
      button.className = 'command-option';
      if (index === selectedIndex) {
        button.classList.add('selected');
      }
      if (option.disabled) {
        button.classList.add('disabled');
      }
      const label = document.createElement('span');
      label.textContent = option.label;
      const hint = document.createElement('span');
      hint.textContent = option.hint ?? '';
      button.appendChild(label);
      button.appendChild(hint);
      item.appendChild(button);
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  public hideBattleMenu(menu: 'command' | 'skill' | 'target'): void {
    const container = this.getMenuContainer(menu);
    if (!container) {
      return;
    }
    container.hidden = true;
    container.innerHTML = '';
  }

  public clearBattleMenus(): void {
    this.hideBattleMenu('command');
    this.hideBattleMenu('skill');
    this.hideBattleMenu('target');
  }

  private getMenuContainer(menu: 'command' | 'skill' | 'target'): HTMLElement | null {
    switch (menu) {
      case 'command':
        return this.commandMenu;
      case 'skill':
        return this.skillMenu;
      case 'target':
        return this.targetMenu;
      default:
        return null;
    }
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
