import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { gameState } from '../managers/GameState';
import { gameData } from '../data-loader';
import { EncounterQuestProgress, EncounterRewards } from '../schemas/encounter';

export class ResultScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private expGainedElement: HTMLElement;
  private goldGainedElement: HTMLElement;
  private lootList: HTMLElement;
  private questList: HTMLElement;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('result-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.expGainedElement = document.getElementById('exp-gained')!;
    this.goldGainedElement = document.getElementById('gold-gained')!;
    this.lootList = document.getElementById('loot-list')!;
    this.questList = document.getElementById('quest-progress-list')!;
  }

  enter(): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
    const outcome = gameState.consumeEncounterOutcome();
    if (outcome) {
      gameState.applyOutcome(outcome);
      this.populateRewards(outcome.rewards, outcome.questProgress);
    } else {
      this.populateRewards({ experience: 0, gold: 0, items: [], lootTables: [] }, []);
    }
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
      this.sceneManager.changeScene('field');
    }
  }

  render(): void {
    // Result scene rendering
  }

  private populateRewards(rewards: EncounterRewards, questProgress: EncounterQuestProgress[]): void {
    this.expGainedElement.textContent = rewards.experience.toString();
    this.goldGainedElement.textContent = rewards.gold.toString();
    this.renderLoot(rewards);
    this.renderQuestProgress(questProgress);
  }

  private renderLoot(rewards: EncounterRewards): void {
    this.lootList.innerHTML = '';
    if (!rewards.items.length) {
      this.appendListItem(this.lootList, 'なし');
      return;
    }
    rewards.items.forEach(item => {
      const itemData = gameData.item?.byId.get(item.id);
      const name = itemData?.name ?? item.id;
      this.appendListItem(this.lootList, name, `×${item.quantity}`);
    });
  }

  private renderQuestProgress(progress: EncounterQuestProgress[]): void {
    this.questList.innerHTML = '';
    if (!progress.length) {
      this.appendListItem(this.questList, '変化なし');
      return;
    }
    progress.forEach(entry => {
      const quest = gameData.quest?.byId.get(entry.questId);
      const name = quest?.name ?? entry.questId;
      let stateLabel = '';
      switch (entry.state) {
        case 'completed':
          stateLabel = '完了';
          break;
        case 'started':
          stateLabel = '開始';
          break;
        default:
          stateLabel = '更新';
      }
      this.appendListItem(this.questList, name, stateLabel);
    });
  }

  private appendListItem(list: HTMLElement, label: string, value?: string): void {
    const li = document.createElement('li');
    li.textContent = value ? `${label}` : label;
    if (value) {
      const span = document.createElement('span');
      span.textContent = value;
      li.appendChild(span);
    }
    list.appendChild(li);
  }
}
