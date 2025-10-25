// spark-saga-repo-starter/src/map/Player.ts
import { InputManager, Action } from '../input/InputManager';
import { Tilemap } from './Tilemap';

export class Player {
  public x: number;
  public y: number;
  private width: number;
  private height: number;
  private color: string;
  private speed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.color = 'blue';
    this.speed = 100;
  }

  public update(deltaTime: number, inputManager: InputManager, tilemap: Tilemap) {
    let dx = 0;
    let dy = 0;

    if (inputManager.isActionDown(Action.MoveUp)) {
      dy -= 1;
    }
    if (inputManager.isActionDown(Action.MoveDown)) {
      dy += 1;
    }
    if (inputManager.isActionDown(Action.MoveLeft)) {
      dx -= 1;
    }
    if (inputManager.isActionDown(Action.MoveRight)) {
      dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    const newX = this.x + dx * this.speed * deltaTime;
    const newY = this.y + dy * this.speed * deltaTime;

    // Check all four corners of the player's bounding box
    if (!tilemap.isObstacle(newX, newY) &&
        !tilemap.isObstacle(newX + this.width, newY) &&
        !tilemap.isObstacle(newX, newY + this.height) &&
        !tilemap.isObstacle(newX + this.width, newY + this.height)) {
        this.x = newX;
        this.y = newY;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
