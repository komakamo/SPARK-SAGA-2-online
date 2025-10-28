import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class FormationScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private party: any[];
  private currentFormationId: string;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('formation-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.currentFormationId = 'square'; // Default formation

    // TODO: Add event listeners for drag-and-drop and formation selection
  }

  enter(): void {
    this.element.hidden = false;
    this.renderFormation();
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      this.sceneManager.closeOverlay();
    }
  }

  render(): void {
    // UI is rendered in the `renderFormation` method,
    // which is called on entering the scene.
  }

  private renderFormation(): void {
    const partyList = document.getElementById('party-list')!;
    const formationSelection = document.getElementById('formation-selection')!;
    const statPreview = document.getElementById('stat-preview')!;

    // Clear previous content
    partyList.innerHTML = '';
    formationSelection.innerHTML = '';
    statPreview.innerHTML = '';

    // Placeholder party data
    const party = [
      { name: 'Hero', stats: { attack: 10, defense: 10, speed: 10, critical: 0.1 }, formationPosition: 'F' },
      { name: 'Mage', stats: { attack: 5, defense: 5, speed: 15, critical: 0.05 }, formationPosition: 'B' },
      { name: 'Warrior', stats: { attack: 15, defense: 15, speed: 5, critical: 0.05 }, formationPosition: 'F' },
    ];
    this.party = party; // Store party data for swapping

    // Render party list
    party.forEach((member, index) => {
      const memberEl = document.createElement('div');
      memberEl.textContent = `${member.name} (${member.formationPosition})`;
      memberEl.draggable = true;
      memberEl.dataset.index = index.toString();
      memberEl.addEventListener('dragstart', this.handleDragStart.bind(this));
      memberEl.addEventListener('dragover', this.handleDragOver.bind(this));
      memberEl.addEventListener('drop', this.handleDrop.bind(this));
      partyList.appendChild(memberEl);
    });

    // Render formation selection
    const formations = gameData.formation.all;
    formations.forEach(formation => {
      const button = document.createElement('button');
      button.textContent = formation.name;
      button.addEventListener('click', () => {
        this.updateFormation(formation.id);
      });
      formationSelection.appendChild(button);
    });

    this.renderStatPreview();
  }

  private updateFormation(formationId: string) {
    this.currentFormationId = formationId;
    const formation = gameData.formation.byId.get(formationId);
    if (!formation) return;

    this.party.forEach((member, index) => {
      member.formationPosition = formation.rows[index] || 'B';
    });

    this.renderFormation();
  }

  private renderStatPreview() {
    const statPreview = document.getElementById('stat-preview')!;
    statPreview.innerHTML = ''; // Clear previous preview

    const table = document.createElement('table');
    const header = table.createTHead();
    const headerRow = header.insertRow();
    headerRow.innerHTML = '<th>Name</th><th>Attack</th><th>Defense</th><th>Speed</th><th>Critical</th>';

    const tbody = table.createTBody();
    this.party.forEach(member => {
      const formation = gameData.formation.byId.get(this.currentFormationId);
      const mods = formation ? formation.modifiers[member.formationPosition === 'F' ? 'front' : 'back'] : {};
      const finalAttack = member.stats.attack * (1 + (mods.attack || 0));
      const finalDefense = member.stats.defense * (1 + (mods.defense || 0));
      const finalSpeed = member.stats.speed * (1 + (mods.speed || 0));
      const finalCritical = member.stats.critical + (mods.critical || 0);

      const row = tbody.insertRow();
      row.innerHTML = `<td>${member.name}</td><td>${finalAttack.toFixed(2)}</td><td>${finalDefense.toFixed(2)}</td><td>${finalSpeed.toFixed(2)}</td><td>${finalCritical.toFixed(2)}</td>`;
    });

    statPreview.appendChild(table);
  }

  private handleDragStart(event: DragEvent): void {
    const target = event.target as HTMLElement;
    event.dataTransfer!.setData('text/plain', target.dataset.index!);
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    const fromIndex = parseInt(event.dataTransfer!.getData('text/plain'), 10);
    const toIndex = parseInt((event.target as HTMLElement).dataset.index!, 10);

    const temp = this.party[fromIndex];
    this.party[fromIndex] = this.party[toIndex];
    this.party[toIndex] = temp;

    this.renderFormation();
  }
}
