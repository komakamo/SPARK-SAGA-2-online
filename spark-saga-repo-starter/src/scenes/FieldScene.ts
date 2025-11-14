import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { Tilemap, TilemapData } from '../map/Tilemap';
import { Player } from '../map/Player';
import { EventManager } from '../managers/EventManager';
import { ConversationManager } from '../managers/ConversationManager';
import { gameData } from '../data-loader';

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
  private defaultEncounterId: string | null = null;

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
    this.defaultEncounterId = gameData.encounter?.all?.[0]?.id ?? null;
  }

  async enter(): Promise<void> {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();

    try {
      const mapUrl = new URL('maps/field.json', window.location.href).toString();
      const response = await fetch(mapUrl);
      if (!response.ok) {
        throw new Error(`Failed to load field map: ${response.status} ${response.statusText}`);
      }
      const data: TilemapData = await response.json();
      this.tilemap = new Tilemap(data);
    } catch (error) {
      console.error('Failed to initialize FieldScene:', error);
      this.uiManager.log('マップの読み込みに失敗しました。時間をおいて再試行してください。');
      this.tilemap = null;
    }
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.tilemap) {
      this.player.update(deltaTime, this.inputManager, this.tilemap);
    }
    if (this.inputManager.isActionJustPressed(Action.Confirm) && this.tilemap) {
      const { x, y, width, height } = this.player.getBounds();
      const eventId = this.tilemap.getEvent(x + width / 2, y + height / 2);
      if (eventId) {
        this.eventManager.triggerEvent(eventId);
      }
    }
    if (this.inputManager.isActionJustPressed(Action.Menu)) {
        this.isDebugMode = !this.isDebugMode;
    }
    if (this.inputManager.isActionJustPressed(Action.Battle)) {
        this.onEncounter();
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

  private onEncounter(encounterId?: string): void {
    const targetEncounter = encounterId ?? this.defaultEncounterId;
    if (!targetEncounter) {
      this.uiManager.log('戦闘データが見つかりませんでした。');
      return;
    }
    this.sceneManager.changeScene('battle', { encounterId: targetEncounter });
  }
}
