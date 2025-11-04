import { InputManager } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export interface Scene {
  inputManager: InputManager;
  uiManager: UIManager;
  enter(params?: unknown): void | Promise<void>;
  exit(): void;
  update(deltaTime: number): void;
  render(): void;
  pause?(): void;
  resume?(): void;
}
