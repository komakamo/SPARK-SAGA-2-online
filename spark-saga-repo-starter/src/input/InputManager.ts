export enum Action {
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  Confirm,
  Cancel,
  Menu,
  TargetPrev,
  TargetNext,
}

export class InputManager {
  private keyMap: Map<string, Action> = new Map();
  private gamepadMap: Map<number, Action> = new Map();
  private activeDevice: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';
  private actionState: Map<Action, boolean> = new Map();
  private justPressedState: Set<Action> = new Set();

  constructor() {
    this.initializeDefaultKeyMap();
    this.initializeDefaultGamepadMap();
    this.detectDevice();
    this.listen();
  }

  private initializeDefaultKeyMap(): void {
    this.keyMap.set('ArrowUp', Action.MoveUp);
    this.keyMap.set('w', Action.MoveUp);
    this.keyMap.set('ArrowDown', Action.MoveDown);
    this.keyMap.set('s', Action.MoveDown);
    this.keyMap.set('ArrowLeft', Action.MoveLeft);
    this.keyMap.set('a', Action.MoveLeft);
    this.keyMap.set('ArrowRight', Action.MoveRight);
    this.keyMap.set('d', Action.MoveRight);
    this.keyMap.set('Enter', Action.Confirm);
    this.keyMap.set(' ', Action.Confirm);
    this.keyMap.set('Escape', Action.Cancel);
    this.keyMap.set('m', Action.Menu);
    this.keyMap.set('q', Action.TargetPrev);
    this.keyMap.set('e', Action.TargetNext);
  }

  private initializeDefaultGamepadMap(): void {
    // Standard Gamepad API button mapping
    this.gamepadMap.set(12, Action.MoveUp); // D-pad Up
    this.gamepadMap.set(13, Action.MoveDown); // D-pad Down
    this.gamepadMap.set(14, Action.MoveLeft); // D-pad Left
    this.gamepadMap.set(15, Action.MoveRight); // D-pad Right
    this.gamepadMap.set(0, Action.Confirm); // A button
    this.gamepadMap.set(1, Action.Cancel); // B button
    this.gamepadMap.set(9, Action.Menu); // Start button
  }

  private detectDevice(): void {
    // Simple detection, can be improved with user override
    if ('ontouchstart' in window) {
      this.activeDevice = 'touch';
    } else if (navigator.getGamepads && navigator.getGamepads()[0]) {
      this.activeDevice = 'gamepad';
    } else {
      this.activeDevice = 'keyboard';
    }
  }

  private listen(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('gamepadconnected', (e) => this.handleGamepadConnected(e));
    // Touch listeners will be added in UIManager
  }

  private handleGamepadConnected(e: GamepadEvent): void {
    console.log('Gamepad connected:', e.gamepad);
    this.activeDevice = 'gamepad';
  }

  private updateGamepadState(): void {
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
      this.gamepadMap.forEach((action, button) => {
        const isPressed = gamepad.buttons[button].pressed;
        const wasPressed = this.actionState.get(action) || false;
        if (isPressed && !wasPressed) {
          this.justPressedState.add(action);
        }
        this.actionState.set(action, isPressed);
      });
    }
  }

  public update(): void {
    this.justPressedState.clear();
    if (this.activeDevice === 'gamepad') {
      this.updateGamepadState();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.key);
    if (action !== undefined && !this.actionState.get(action)) {
      this.justPressedState.add(action);
    }
    if (action !== undefined) {
      this.actionState.set(action, true);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.key);
    if (action !== undefined) {
      this.actionState.set(action, false);
    }
  }

  public isActionDown(action: Action): boolean {
    return this.actionState.get(action) || false;
  }

  public isActionJustPressed(action: Action): boolean {
    return this.justPressedState.has(action);
  }

  public getActiveDevice(): 'keyboard' | 'gamepad' | 'touch' {
    return this.activeDevice;
  }

  public setActiveDevice(device: 'keyboard' | 'gamepad' | 'touch'): void {
    this.activeDevice = device;
  }

  public setActionState(action: Action, state: boolean): void {
    const wasPressed = this.actionState.get(action) || false;
    if (state && !wasPressed) {
      this.justPressedState.add(action);
    }
    this.actionState.set(action, state);
  }
}
