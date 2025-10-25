export interface Scene {
  enter(): void;
  exit(): void;
  update(deltaTime: number): void;
  render(): void;
  pause?(): void;
  resume?(): void;
}
