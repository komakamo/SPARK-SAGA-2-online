import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { EventManager } from '../src/managers/EventManager';
import { ConversationManager, ConversationGameState } from '../src/managers/ConversationManager';
import { gameData } from '../src/data-loader';
import { Event, EventNode } from '../src/schemas/event';
import { EventMapEntry } from '../src/schemas/event-map';

class StubUIManager {
  public logs: string[] = [];
  public shownNode: EventNode | null = null;

  showConversation(node: EventNode) {
    this.shownNode = node;
  }

  hideConversation() {
    this.shownNode = null;
  }

  log(message: string) {
    this.logs.push(message);
  }
}

const baseGameState: ConversationGameState = {
  region: 'tutorial',
  er: 1,
  party: ['hero'],
  inventory: { potion: 1 },
  quests: new Map<string, string>(),
  flags: new Map<string, boolean>(),
};

const mockEvents: Event[] = [
  {
    id: 'sample_event',
    name: 'A Simple Choice',
    description: 'A sample event to demonstrate the conversation engine.',
    nodes: [
      {
        id: 'start',
        type: 'dialog',
        text: 'i18n.sample_event.start',
        next: 'choice_1',
      },
      {
        id: 'choice_1',
        type: 'choice',
        choices: [
          { text: 'i18n.sample_event.choice_a', next: 'outcome_a' },
          { text: 'i18n.sample_event.choice_b', next: 'outcome_b' },
        ],
      },
      {
        id: 'outcome_a',
        type: 'reward',
        item_id: 'potion',
        quantity: 1,
        next: 'end',
      },
      {
        id: 'outcome_b',
        type: 'quest_start',
        quest_id: 'sample_quest',
        next: 'end',
      },
      {
        id: 'end',
        type: 'dialog',
        text: 'i18n.sample_event.end',
        next: null,
      },
    ],
  },
];

const eventMapEntries: EventMapEntry[] = [
  {
    id: 'conversation_test',
    tileEventId: 1,
    type: 'conversation',
    conversationId: 'sample_event',
    label: '村人',
    repeatable: true,
    effects: [
      { type: 'log', message: '村人は笑顔で手を振った。' },
      { type: 'set_flag', flagId: 'villager_greeted', value: true },
    ],
  },
  {
    id: 'treasure_test',
    tileEventId: 2,
    type: 'treasure',
    label: '古びた宝箱',
    repeatable: false,
    effects: [
      { type: 'log', message: '宝箱を開けた！' },
      { type: 'give_item', itemId: 'potion', quantity: 1 },
    ],
  },
  {
    id: 'gather_test',
    tileEventId: 3,
    type: 'gathering',
    label: '薬草の群生地',
    repeatable: true,
    cooldownMs: 5000,
    effects: [
      { type: 'give_item', itemId: 'antidote', quantity: 1 },
    ],
  },
];

describe('EventManager', () => {
  beforeEach(() => {
    gameData.event = {
      byId: new Map(mockEvents.map(event => [event.id, event])),
      all: mockEvents,
    } as any;
    gameData.eventMap = {
      byId: new Map(eventMapEntries.map(entry => [entry.id, entry])),
      byTileEventId: new Map(eventMapEntries.map(entry => [entry.tileEventId, entry])),
      all: eventMapEntries,
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles conversation events and applies completion effects', () => {
    const ui = new StubUIManager();
    const conversationManager = new ConversationManager({ ...baseGameState, quests: new Map(), flags: new Map(), inventory: { potion: 1 } });
    const eventManager = new EventManager(ui as any, conversationManager);

    eventManager.triggerEvent(1);
    expect(ui.shownNode?.id).toBe('start');

    conversationManager.next();
    conversationManager.handleChoice(0);
    conversationManager.next();
    conversationManager.next();

    expect(ui.shownNode).toBeNull();
    expect(conversationManager.getFlag('villager_greeted')).toBe(true);
    expect(ui.logs).toContain('村人は笑顔で手を振った。');
  });

  it('awards treasure and prevents reopening when repeatable is false', () => {
    const ui = new StubUIManager();
    const conversationManager = new ConversationManager({ ...baseGameState, quests: new Map(), flags: new Map(), inventory: { potion: 1 } });
    const eventManager = new EventManager(ui as any, conversationManager);

    eventManager.triggerEvent(2);
    expect(conversationManager.getItemQuantity('potion')).toBe(2);
    expect(ui.logs).toContain('宝箱を開けた！');

    eventManager.triggerEvent(2);
    expect(conversationManager.getItemQuantity('potion')).toBe(2);
    expect(ui.logs.at(-1)).toBe('古びた宝箱はまだ反応がない。');
  });

  it('enforces cooldown for gathering events', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));

    const ui = new StubUIManager();
    const conversationManager = new ConversationManager({ ...baseGameState, quests: new Map(), flags: new Map(), inventory: { potion: 1, antidote: 0 } });
    const eventManager = new EventManager(ui as any, conversationManager);

    eventManager.triggerEvent(3);
    expect(conversationManager.getItemQuantity('antidote')).toBe(1);

    eventManager.triggerEvent(3);
    expect(conversationManager.getItemQuantity('antidote')).toBe(1);
    expect(ui.logs.at(-1)).toBe('薬草の群生地はまだ反応がない。');

    vi.setSystemTime(new Date('2023-01-01T00:00:05Z'));
    eventManager.triggerEvent(3);
    expect(conversationManager.getItemQuantity('antidote')).toBe(2);
  });
});
