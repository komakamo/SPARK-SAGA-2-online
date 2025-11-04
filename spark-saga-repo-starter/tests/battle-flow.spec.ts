import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { loadGameData } from '../src/data-loader';
import { gameState } from '../src/managers/GameState';
import { InputManager, Action } from '../src/input/InputManager';
import { SceneManager } from '../src/managers/SceneManager';
import { BattleScene } from '../src/scenes/BattleScene';
import { ResultScene } from '../src/scenes/ResultScene';
import type { Scene } from '../src/scenes/Scene';
import type { ConversationManager } from '../src/managers/ConversationManager';
import type { UIManager } from '../src/ui/UIManager';

const dataRoot = path.resolve(__dirname, '../data');

type FakeElement = {
  id?: string;
  tagName: string;
  children: FakeElement[];
  textContent: string;
  hidden: boolean;
  className: string;
  innerHTML: string;
  classList: { add: (...tokens: string[]) => void; remove: (...tokens: string[]) => void };
  appendChild: (child: FakeElement) => FakeElement;
};

const elements = new Map<string, FakeElement>();

function makeElement(tag: string, id?: string): FakeElement {
  let innerHTML = '';
  const classSet = new Set<string>();
  return {
    id,
    tagName: tag.toUpperCase(),
    children: [],
    textContent: '',
    hidden: false,
    className: '',
    get innerHTML() {
      return innerHTML;
    },
    set innerHTML(value: string) {
      innerHTML = value;
      this.children = [];
    },
    classList: {
      add: (...tokens: string[]) => tokens.forEach(token => classSet.add(token)),
      remove: (...tokens: string[]) => tokens.forEach(token => classSet.delete(token)),
    },
    appendChild(child: FakeElement) {
      this.children.push(child);
      return child;
    },
  };
}

function registerElement(id: string, tag: string = 'div'): FakeElement {
  const element = makeElement(tag, id);
  elements.set(id, element);
  return element;
}

function setupDom() {
  elements.clear();
  const requiredIds = [
    'ui-container',
    'ui-header',
    'ui-main',
    'ui-footer',
    'log-pane',
    'help-display',
    'touch-controls',
    'conversation-overlay',
    'dialog-box',
    'dialog-text',
    'choice-list',
    'battle-scene',
    'battle-log-container',
    'player-status',
    'enemy-status',
    'command-menu',
    'skill-menu',
    'target-menu',
    'result-scene',
    'exp-gained',
    'gold-gained',
    'loot-list',
    'quest-progress-list',
    'field-scene',
  ];
  requiredIds.forEach(id => registerElement(id));

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
    body: { innerHTML: '' },
    getElementById: (id: string) => elements.get(id) ?? registerElement(id),
    createElement: (tag: string) => makeElement(tag),
    },
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      addEventListener() {},
      removeEventListener() {},
    },
  });

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      getGamepads: () => [null],
    },
  });
}

class StubUIManager {
  constructor(public inputManager: InputManager) {}
  updateHelpDisplay() {}
  updateBattleStatus() {}
  renderBattleMenu() {}
  hideBattleMenu() {}
  clearBattleMenus() {}
  log() {}
  showConversation() {}
  hideConversation() {}
}

describe('battle to result flow', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    setupDom();

    const fetchMock = vi.fn(async (resource: string) => {
      const relativePath = resource.replace(/^data\//, '');
      const filePath = path.join(dataRoot, relativePath);
      const fileContents = await readFile(filePath, 'utf-8');
      return {
        ok: true,
        statusText: 'OK',
        json: async () => JSON.parse(fileContents),
      } as any;
    });

    global.fetch = fetchMock as any;
    await loadGameData();
    gameState.initialize();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error cleanup
      delete global.fetch;
    }
  });

  it('records rewards and returns to field after result confirmation', () => {
    const inputManager = new InputManager();
    const conversationStub = {
      currentNode: null,
      startConversation: vi.fn(),
      next: vi.fn(),
      handleChoice: vi.fn(),
    } as unknown as ConversationManager;
    const uiManager = new StubUIManager(inputManager) as unknown as UIManager;
    const sceneManager = new SceneManager(inputManager, uiManager, conversationStub);

    const battleScene = new BattleScene(sceneManager, inputManager, uiManager);
    const resultScene = new ResultScene(sceneManager, inputManager, uiManager);

    const fieldEntered = { count: 0 };
    const fieldScene: Scene = {
      inputManager,
      uiManager,
      enter: () => {
        fieldEntered.count += 1;
      },
      exit: () => {},
      update: () => {},
      render: () => {},
    };

    sceneManager.addScene('battle', battleScene);
    sceneManager.addScene('result', resultScene);
    sceneManager.addScene('field', fieldScene);

    sceneManager.changeScene('battle', { encounterId: 'tutorial_wolf_pack' });
    expect(sceneManager.getCurrentSceneName()).toBe('battle');

    (battleScene as any).onVictory();

    expect(sceneManager.getCurrentSceneName()).toBe('result');
    expect(document.getElementById('exp-gained')?.textContent).toBe('24');
    expect(document.getElementById('gold-gained')?.textContent).toBe('12');
    const lootList = elements.get('loot-list');
    expect(lootList?.children.length ?? 0).toBeGreaterThan(0);
    const questList = elements.get('quest-progress-list');
    expect(questList?.children.length ?? 0).toBeGreaterThan(0);
    expect(gameState.inventory.get('potion')).toBe(1);
    expect(gameState.questStates.get('sample_quest')).toBe('completed');

    inputManager.setActionState(Action.Confirm, true);
    resultScene.update(0);
    inputManager.setActionState(Action.Confirm, false);

    expect(sceneManager.getCurrentSceneName()).toBe('field');
    expect(fieldEntered.count).toBe(1);
  });
});
