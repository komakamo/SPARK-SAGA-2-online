import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager, BattleMenuOption } from '../ui/UIManager';
import { Combatant } from '../combat/Combatant';
import { ActiveStatusEffect } from '../combat/StatusEffect';
import { gameData } from '../data-loader';
import { gameState } from '../managers/GameState';
import { PartyCommandDefinition, PartyDefinition, PartyMemberDefinition } from '../schemas/party';
import { EncounterDefinition, EncounterEnemyDefinition } from '../schemas/encounter';
import { Skill } from '../schemas/skill';
import { Enemy } from '../schemas/enemy';

interface PendingAction {
  type: 'attack' | 'skill';
  commandId: string;
  actor: Combatant;
  skill?: Skill;
}

type SelectionState = 'idle' | 'command' | 'skill' | 'target' | 'enemy';

type CombatantSide = 'ally' | 'enemy';

interface CombatantMeta {
  side: CombatantSide;
  commands?: PartyCommandDefinition[];
  skills?: string[];
  name: string;
}

function isValidParams(params: unknown): params is { encounterId: string } {
  return typeof params === 'object' && params !== null && 'encounterId' in params;
}

export class BattleScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private logContainer: HTMLElement;

  private allies: Combatant[] = [];
  private enemies: Combatant[] = [];
  private combatantMeta: Map<Combatant, CombatantMeta> = new Map();
  private encounter: EncounterDefinition | null = null;

  private turnOrder: Combatant[] = [];
  private currentTurnIndex = 0;
  private activeActor: Combatant | null = null;
  private selectionState: SelectionState = 'idle';
  private pendingAction: PendingAction | null = null;

  private availableCommands: PartyCommandDefinition[] = [];
  private commandOptions: BattleMenuOption[] = [];
  private skillOptions: { skill: Skill; option: BattleMenuOption }[] = [];
  private targetOptions: Combatant[] = [];
  private selectedCommandIndex = 0;
  private selectedSkillIndex = 0;
  private selectedTargetIndex = 0;

  public battleLog: string[] = [];

  constructor(sceneManager: SceneManager, inputManager: InputManager, uiManager: UIManager) {
    this.element = document.getElementById('battle-scene')!;
    this.logContainer = document.getElementById('battle-log-container')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
  }

  enter(params?: unknown): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
    this.uiManager.clearBattleMenus();
    this.battleLog = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.pendingAction = null;
    this.selectionState = 'idle';

    const encounterId = isValidParams(params) ? params.encounterId : this.encounter?.id;
    if (!encounterId) {
      this.log('戦闘情報が取得できませんでした。');
      this.sceneManager.changeScene('field');
      return;
    }

    const encounter = gameData.encounter?.byId.get(encounterId);
    if (!encounter) {
      this.log(`Encounter "${encounterId}" が見つかりません。`);
      this.sceneManager.changeScene('field');
      return;
    }

    const partyDefinition = gameState.ensurePartyForEncounter(encounter);
    if (!partyDefinition) {
      this.log('参加可能なパーティが見つかりません。');
      this.sceneManager.changeScene('field');
      return;
    }

    this.encounter = encounter;
    this.setupCombatants(partyDefinition, encounter);

    this.uiManager.updateBattleStatus(this.allies, this.enemies);
    this.log(`${encounter.name} が出現！`);
    this.nextTurn();
  }

  exit(): void {
    this.element.hidden = true;
    this.battleLog = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.activeActor = null;
    this.pendingAction = null;
    this.allies.forEach(ally => ally.reset());
    this.enemies.forEach(enemy => enemy.reset());
    this.uiManager.clearBattleMenus();
  }

  update(_: number): void {
    switch (this.selectionState) {
      case 'command':
        this.handleCommandInput();
        break;
      case 'skill':
        this.handleSkillInput();
        break;
      case 'target':
        this.handleTargetInput();
        break;
      default:
        break;
    }
  }

  render(): void {
    // Rendering handled via DOM updates.
  }

  pause(): void {
    if (import.meta.env.DEV) {
      console.log('BattleScene paused');
    }
  }

  resume(): void {
    if (import.meta.env.DEV) {
      console.log('BattleScene resumed');
    }
  }

  private setupCombatants(party: PartyDefinition, encounter: EncounterDefinition): void {
    this.combatantMeta.clear();
    this.allies = party.members.map(member => this.createPartyCombatant(member, party));
    this.enemies = encounter.enemies
      .map(entry => this.createEnemyCombatant(entry))
      .filter((combatant): combatant is Combatant => combatant !== null);

    this.turnOrder = [...this.allies, ...this.enemies].sort((a, b) => b.finalSpeed - a.finalSpeed);
  }

  private createPartyCombatant(member: PartyMemberDefinition, party: PartyDefinition): Combatant {
    const stats = member.stats;
    const combatant = new Combatant(
      stats.maxHp,
      stats.maxLp,
      stats.maxWp,
      stats.maxJp,
      stats.speed,
      stats.weaponAttack,
      stats.strength,
      stats.defense,
      stats.staffCorrection,
      stats.intelligence,
      stats.magicDefense,
      stats.dexterity,
      stats.agility,
      stats.criticalChance,
      member.resistances ?? {},
      party.formation,
      member.formationPosition,
    );
    combatant.setName(member.name);
    this.combatantMeta.set(combatant, {
      side: 'ally',
      commands: member.commands,
      name: member.name,
    });
    return combatant;
  }

  private createEnemyCombatant(entry: EncounterEnemyDefinition): Combatant | null {
    const enemyDefinition: Enemy | undefined = gameData.enemy?.byId.get(entry.enemyId);
    if (!enemyDefinition) {
      this.log(`敵データ "${entry.enemyId}" が見つかりません。`);
      return null;
    }

    const baseStats = enemyDefinition.stats;
    const stats = {
      ...baseStats,
      ...(entry.stats ?? {}),
    };
    const resistances = {
      ...(enemyDefinition.resistances ?? {}),
      ...(entry.resistances ?? {}), 
    };
    const combatant = new Combatant(
      stats.maxHp,
      stats.maxLp,
      stats.maxWp,
      stats.maxJp,
      stats.speed,
      stats.weaponAttack,
      stats.strength,
      stats.defense,
      stats.staffCorrection,
      stats.intelligence,
      stats.magicDefense,
      stats.dexterity,
      stats.agility,
      stats.criticalChance,
      resistances,
      'square',
      entry.formationPosition ?? 'F',
    );
    combatant.setName(enemyDefinition.name);
    this.combatantMeta.set(combatant, {
      side: 'enemy',
      skills: enemyDefinition.skills ?? [],
      name: enemyDefinition.name,
    });
    return combatant;
  }

  private nextTurn(): void {
    if (this.checkBattleEnd()) {
      return;
    }

    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const combatant = this.turnOrder[this.currentTurnIndex];
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;

      if (!combatant.isAlive()) {
        attempts++;
        continue;
      }

      const triggeredEffects = combatant.beginTurn();
      this.uiManager.updateBattleStatus(this.allies, this.enemies);
      this.logStatusEffects(combatant, triggeredEffects);

      if (!combatant.canAct()) {
        this.log(`${combatant.name} は行動できない！`);
        attempts++;
        continue;
      }

      if (combatant.isConfused()) {
        this.log(`${combatant.name} は混乱している！`);
        const allTargets = [...this.allies, ...this.enemies].filter(target => target.isAlive());
        const randomTarget = allTargets[Math.floor(Math.random() * allTargets.length)];
        this.resolveAction({ type: 'attack', commandId: 'confused', actor: combatant }, randomTarget);
        return;
      }

      const meta = this.combatantMeta.get(combatant);
      if (!meta) {
        attempts++;
        continue;
      }

      if (meta.side === 'ally') {
        this.startPlayerTurn(combatant, meta.commands ?? []);
      } else {
        this.handleEnemyTurn(combatant, meta);
      }
      return;
    }

    this.log('戦闘を継続できる戦力が残っていません。');
    this.onGameOver();
  }

  private checkBattleEnd(): boolean {
    if (this.enemies.every(enemy => !enemy.isAlive())) {
      this.log('敵をすべて倒した！');
      this.onVictory();
      return true;
    }

    if (this.allies.every(ally => !ally.isAlive())) {
      this.log('パーティは力尽きた…');
      this.onGameOver();
      return true;
    }

    return false;
  }

  private startPlayerTurn(actor: Combatant, commands: PartyCommandDefinition[]): void {
    this.activeActor = actor;
    this.availableCommands = commands;
    this.selectedCommandIndex = 0;
    this.selectionState = 'command';
    this.pendingAction = null;

    this.log(`${actor.name} のターン。`);
    this.refreshCommandMenu();
  }

  private refreshCommandMenu(): void {
    if (!this.activeActor) {
      return;
    }
    if (this.availableCommands.length === 0) {
      this.log(`${this.activeActor.name} は実行可能なコマンドを持っていない。`);
      this.selectionState = 'idle';
      this.nextTurn();
      return;
    }

    this.commandOptions = this.availableCommands.map(command => {
      if (command.type === 'skill') {
        const skills = this.getSkillsForCommand(command);
        const usableSkills = skills.filter(({ skill }) => this.canPayCost(this.activeActor!, skill.cost));
        return {
          id: command.id,
          label: command.name,
          hint: usableSkills.length ? `${usableSkills.length} 技` : 'なし',
          disabled: usableSkills.length === 0,
        } satisfies BattleMenuOption;
      }
      if (command.type === 'item') {
        const count = command.items?.length ?? 0;
        return {
          id: command.id,
          label: command.name,
          hint: count ? `${count} 個` : '未所持',
          disabled: true,
        } satisfies BattleMenuOption;
      }
      return {
        id: command.id,
        label: command.name,
      } satisfies BattleMenuOption;
    });

    if (this.selectedCommandIndex >= this.commandOptions.length) {
      this.selectedCommandIndex = this.commandOptions.length - 1;
    }

    this.uiManager.renderBattleMenu('command', this.commandOptions, this.selectedCommandIndex, `${this.activeActor.name} コマンド`);
    this.uiManager.hideBattleMenu('skill');
    this.uiManager.hideBattleMenu('target');
  }

  private getSkillsForCommand(command: PartyCommandDefinition): { skill: Skill; option: BattleMenuOption }[] {
    const skillIds = command.skills ?? [];
    return skillIds
      .map(id => gameData.skill?.byId.get(id))
      .filter((skill): skill is Skill => Boolean(skill))
      .map(skill => ({
        skill,
        option: {
          id: skill.id,
          label: skill.name,
          hint: this.formatSkillCost(skill.cost),
          disabled: this.activeActor ? !this.canPayCost(this.activeActor, skill.cost) : true,
        },
      }));
  }

  private handleCommandInput(): void {
    if (!this.activeActor) {
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.MoveDown)) {
      this.selectedCommandIndex = (this.selectedCommandIndex + 1) % this.commandOptions.length;
      this.refreshCommandMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.MoveUp)) {
      this.selectedCommandIndex =
        (this.selectedCommandIndex - 1 + this.commandOptions.length) % this.commandOptions.length;
      this.refreshCommandMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      this.attemptEscape();
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
      const command = this.availableCommands[this.selectedCommandIndex];
      if (!command) {
        return;
      }

      switch (command.type) {
        case 'defend':
          this.activeActor.startGuarding();
          this.log(`${this.activeActor.name} は身を固めた。`);
          this.uiManager.clearBattleMenus();
          this.selectionState = 'idle';
          this.nextTurn();
          break;
        case 'attack':
          this.pendingAction = {
            type: 'attack',
            commandId: command.id,
            actor: this.activeActor,
          };
          this.openTargetSelection(this.enemies, '対象選択');
          break;
        case 'skill':
          this.openSkillMenu(command);
          break;
        case 'item':
          this.log('アイテムコマンドは未実装です。');
          break;
        default:
          break;
      }
    }
  }

  private handleSkillInput(): void {
    if (!this.activeActor) {
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.MoveDown)) {
      this.selectedSkillIndex = (this.selectedSkillIndex + 1) % this.skillOptions.length;
      this.refreshSkillMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.MoveUp)) {
      this.selectedSkillIndex =
        (this.selectedSkillIndex - 1 + this.skillOptions.length) % this.skillOptions.length;
      this.refreshSkillMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      this.selectionState = 'command';
      this.refreshCommandMenu();
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
      const entry = this.skillOptions[this.selectedSkillIndex];
      if (!entry || entry.option.disabled) {
        return;
      }
      this.pendingAction = {
        type: 'skill',
        commandId: entry.skill.id,
        actor: this.activeActor,
        skill: entry.skill,
      };
      this.openTargetSelection(this.enemies, '対象選択');
    }
  }

  private handleTargetInput(): void {
    if (this.targetOptions.length === 0) {
      this.selectionState = 'command';
      this.refreshCommandMenu();
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.MoveDown) ||
      this.inputManager.isActionJustPressed(Action.MoveRight)) {
      this.selectedTargetIndex = (this.selectedTargetIndex + 1) % this.targetOptions.length;
      this.refreshTargetMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.MoveUp) ||
      this.inputManager.isActionJustPressed(Action.MoveLeft)) {
      this.selectedTargetIndex =
        (this.selectedTargetIndex - 1 + this.targetOptions.length) % this.targetOptions.length;
      this.refreshTargetMenu();
    }

    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      if (this.pendingAction?.type === 'skill') {
        this.selectionState = 'skill';
        this.refreshSkillMenu();
      } else {
        this.selectionState = 'command';
        this.refreshCommandMenu();
      }
      return;
    }

    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
      const target = this.targetOptions[this.selectedTargetIndex];
      if (!target || !target.isAlive() || !this.pendingAction) {
        return;
      }
      this.resolveAction(this.pendingAction, target);
    }
  }

  private openSkillMenu(command: PartyCommandDefinition): void {
    this.skillOptions = this.getSkillsForCommand(command);
    if (this.skillOptions.length === 0) {
      this.log('使用可能な技がありません。');
      return;
    }
    this.selectedSkillIndex = Math.max(
      0,
      this.skillOptions.findIndex(entry => !entry.option.disabled),
    );
    if (this.selectedSkillIndex < 0) {
      this.selectedSkillIndex = 0;
    }
    this.selectionState = 'skill';
    this.refreshSkillMenu();
  }

  private refreshSkillMenu(): void {
    this.uiManager.renderBattleMenu(
      'skill',
      this.skillOptions.map(entry => entry.option),
      this.selectedSkillIndex,
      '技',
    );
  }

  private openTargetSelection(targetPool: Combatant[], title: string): void {
    const aliveTargets = targetPool.filter(target => target.isAlive());
    if (aliveTargets.length === 0) {
      this.log('有効なターゲットがいません。');
      this.selectionState = 'command';
      this.refreshCommandMenu();
      return;
    }
    this.targetOptions = aliveTargets;
    this.selectedTargetIndex = 0;
    this.selectionState = 'target';
    this.renderTargetMenu(title);
  }

  private refreshTargetMenu(): void {
    this.renderTargetMenu('対象選択');
  }

  private renderTargetMenu(title: string): void {
    const options = this.targetOptions.map(target => ({
      id: target.name,
      label: `${target.name}`,
      hint: `HP ${target.hp}/${target.maxHp}`,
    }));
    this.uiManager.renderBattleMenu('target', options, this.selectedTargetIndex, title);
  }

  private resolveAction(action: PendingAction, target: Combatant): void {
    const actor = action.actor;
    if (!actor.isAlive()) {
      this.selectionState = 'idle';
      this.pendingAction = null;
      this.nextTurn();
      return;
    }

    switch (action.type) {
      case 'attack':
        this.performAttack(actor, target, null);
        break;
      case 'skill':
        if (!action.skill) {
          return;
        }
        if (!this.canPayCost(actor, action.skill.cost)) {
          this.log(`${actor.name} は${action.skill.name}を使うだけのリソースが不足している。`);
          this.selectionState = 'command';
          this.refreshCommandMenu();
          return;
        }
        actor.spendResources(action.skill.cost);
        this.performAttack(actor, target, action.skill);
        break;
      default:
        break;
    }

    this.pendingAction = null;
    this.selectionState = 'idle';
    this.uiManager.clearBattleMenus();
    this.uiManager.updateBattleStatus(this.allies, this.enemies);
    this.nextTurn();
  }

  private performAttack(attacker: Combatant, target: Combatant, skill: Skill | null): void {
    const power = skill?.power ?? 0;
    const damageType = (skill?.element ?? 'slash') as keyof typeof attacker.resistances;
    const attackType = skill?.type ?? 'physical';
    const result = target.takeDamage(power, attacker, attackType, damageType);

    const attackerName = attacker.name;
    const targetName = target.name;

    if (result.outcome === 'Miss') {
      this.log(`${attackerName} の攻撃は外れた！`);
    } else {
      if (result.outcome === 'Critical') {
        this.log(`クリティカル！${attackerName} は ${targetName} に ${result.damage} のダメージ。`);
      } else {
        this.log(`${attackerName} は ${targetName} に ${result.damage} のダメージ。`);
      }
      if (result.revived) {
        this.log(`${targetName} は LP で踏みとどまった。`);
      }
      if (!target.isAlive()) {
        this.log(`${targetName} を倒した！`);
      }
    }

    if (skill && skill.statusEffects.length > 0) {
      this.applyStatusEffects(skill, target);
    }
  }

  private applyStatusEffects(skill: Skill, target: Combatant): void {
    skill.statusEffects.forEach(statusId => {
      const definition = gameData.statusEffects?.byId.get(statusId);
      if (definition) {
        target.addStatusEffect(definition);
        this.log(`${target.name} に ${definition.name} の効果！`);
      }
    });
  }

  private handleEnemyTurn(actor: Combatant, meta: CombatantMeta): void {
    this.selectionState = 'enemy';
    this.log(`${actor.name} のターン。`);
    const possibleTargets = this.allies.filter(ally => ally.isAlive());
    if (possibleTargets.length === 0) {
      this.onGameOver();
      return;
    }
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    const skills = (meta.skills ?? [])
      .map(id => gameData.skill?.byId.get(id))
      .filter((skill): skill is Skill => Boolean(skill));
    const usableSkills = skills.filter(skill => this.canPayCost(actor, skill.cost));

    if (usableSkills.length > 0 && Math.random() < 0.6) {
      const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)];
      actor.spendResources(skill.cost);
      this.performAttack(actor, target, skill);
    } else {
      this.performAttack(actor, target, null);
    }

    this.uiManager.updateBattleStatus(this.allies, this.enemies);
    this.selectionState = 'idle';
    this.nextTurn();
  }

  private attemptEscape(): void {
    if (Math.random() < 0.4) {
      this.log('パーティはうまく撤退した。');
      this.sceneManager.changeScene('field');
    } else {
      this.log('逃走に失敗した！');
      this.selectionState = 'idle';
      this.nextTurn();
    }
  }

  private onVictory(): void {
    if (!this.encounter) {
      this.sceneManager.changeScene('field');
      return;
    }
    gameState.recordEncounterOutcome(this.encounter.id, this.encounter.rewards, this.encounter.questProgress);
    this.sceneManager.changeScene('result', { encounterId: this.encounter.id });
  }

  private onGameOver(): void {
    this.sceneManager.changeScene('title');
  }

  private canPayCost(combatant: Combatant, cost: { wp?: number; jp?: number }): boolean {
    const requiredWp = cost.wp ?? 0;
    const requiredJp = cost.jp ?? 0;
    return combatant.wp >= requiredWp && combatant.jp >= requiredJp;
  }

  private formatSkillCost(cost: { wp?: number; jp?: number }): string {
    const parts: string[] = [];
    if (cost.wp) {
      parts.push(`WP ${cost.wp}`);
    }
    if (cost.jp) {
      parts.push(`JP ${cost.jp}`);
    }
    return parts.length > 0 ? parts.join(' / ') : '消費なし';
  }

  private log(message: string): void {
    this.battleLog.push(message);
    this.updateLog();
  }

  private updateLog(): void {
    this.logContainer.innerHTML = '';
    const reversedLog = [...this.battleLog].slice(-12).reverse();
    reversedLog.forEach(message => {
      const p = document.createElement('p');
      p.textContent = message;
      this.logContainer.appendChild(p);
    });
  }

  private logStatusEffects(combatant: Combatant, effects: ActiveStatusEffect[]): void {
    effects.forEach(effect => {
      effect.definition.effects.forEach(def => {
        if (def.type === 'damage_over_time' && def.value) {
          this.log(`${combatant.name} は ${effect.definition.name} で ${def.value} のダメージを受けた。`);
        }
      });
    });
  }
}
