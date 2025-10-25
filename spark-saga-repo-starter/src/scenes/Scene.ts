import { InputManager } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export interface Scene {
  inputManager: InputManager;
  uiManager: UIManager;
  enter(): void;
  exit(): void;
  update(deltaTime: number): void;
  render(): void;
  pause?(): void;
  resume?(): void;
}
