import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { Tilemap, TilemapData } from '../map/Tilemap';
import { Player } from '../map/Player';
import { EventManager } from '../managers/EventManager';
import { ConversationManager } from '../managers/ConversationManager';

export class FieldScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tilemap: Tilemap | null = null;
  private player: Player;
  private eventManager: EventManager;
  private isDebugMode: boolean = false;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('field-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.canvas = document.getElementById('field-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.player = new Player(32, 32);
    this.eventManager = new EventManager(this.uiManager, this.sceneManager.conversationManager);
  }

  async enter(): Promise<void> {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();

    const response = await fetch('/maps/field.json');
    const data: TilemapData = await response.json();
    this.tilemap = new Tilemap(data);
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.tilemap) {
      this.player.update(deltaTime, this.inputManager, this.tilemap);
    }
    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
        const eventId = this.tilemap?.getEvent(this.player.x, this.player.y);
        if (eventId) {
            this.eventManager.triggerEvent(eventId);
        }
    }
    if (this.inputManager.isActionJustPressed(Action.Menu)) {
        this.isDebugMode = !this.isDebugMode;
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.tilemap) {
      this.tilemap.render(this.ctx, this.isDebugMode);
    }
    this.player.render(this.ctx);
  }

  pause(): void {
    if (import.meta.env.DEV) {
      console.log('FieldScene paused');
    }
  }

  resume(): void {
    if (import.meta.env.DEV) {
      console.log('FieldScene resumed');
    }
  }

  private onEncounter(): void {
    this.sceneManager.changeScene('battle');
  }
}
