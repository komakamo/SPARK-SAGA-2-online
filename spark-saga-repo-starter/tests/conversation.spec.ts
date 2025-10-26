// spark-saga-repo-starter/tests/conversation.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationManager } from '../src/managers/ConversationManager';
import { eventsSchema } from '../src/schemas/event';

// Mock event data
const mockEvents = [
  {
    "id": "sample_event",
    "name": "A Simple Choice",
    "description": "A sample event to demonstrate the conversation engine.",
    "nodes": [
      {
        "id": "start",
        "type": "dialog",
        "text": "i18n.sample_event.start",
        "next": "choice_1"
      },
      {
        "id": "choice_1",
        "type": "choice",
        "choices": [
          { "text": "i18n.sample_event.choice_a", "next": "outcome_a" },
          { "text": "i18n.sample_event.choice_b", "next": "outcome_b" }
        ]
      },
      {
        "id": "outcome_a",
        "type": "reward",
        "item_id": "potion",
        "quantity": 1,
        "next": "end"
      },
      {
        "id": "outcome_b",
        "type": "quest_start",
        "quest_id": "sample_quest",
        "next": "end"
      },
      {
        "id": "end",
        "type": "dialog",
        "text": "i18n.sample_event.end",
        "next": null
      }
    ]
  }
];

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockEvents),
  })
) as any;

describe('ConversationManager', () => {
  let conversationManager: ConversationManager;

  beforeEach(() => {
    conversationManager = new ConversationManager();
  });

  it('should load events', async () => {
    // Need to wait for the async loadEvents to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(conversationManager['events'].size).toBe(1);
  });

  it('should start a conversation', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const startNode = conversationManager.startConversation('sample_event');
    expect(startNode?.type).toBe('dialog');
  });

  it('should handle choices', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    conversationManager.startConversation('sample_event');
    conversationManager.next(); // progress to choice node
    conversationManager.handleChoice(0);
    const currentNode = conversationManager['currentNode'];
    // The node after choice is reward, which then automatically progresses to the next one
    expect(currentNode?.id).toBe('end');
  });

  it('E2E: should update quest state after a choice', async () => {
    const gameState = {
      region: 'tutorial',
      er: 1,
      party: ['hero'],
      inventory: { 'potion': 1 },
      quests: new Map<string, string>(),
    };
    conversationManager = new ConversationManager(gameState);
    await new Promise(resolve => setTimeout(resolve, 100));

    conversationManager.startConversation('sample_event');
    conversationManager.next(); // progress to choice node
    conversationManager.handleChoice(1); // Choose to start the quest

    expect(gameState.quests.get('sample_quest')).toBe('started');
  });
});
