// spark-saga-repo-starter/src/managers/EventManager.ts
import { gameData } from '../data-loader';
import { EventMapEffect, EventMapEntry } from '../schemas/event-map';
import { UIManager } from '../ui/UIManager';
import { ConversationManager } from './ConversationManager';

export class EventManager {
  private eventsByTileId: Map<number, EventMapEntry> = new Map();
  private cooldownExpirations: Map<number, number> = new Map();
  private completedEvents: Set<number> = new Set();
  private uiManager: UIManager;
  private conversationManager: ConversationManager;
  private updateConversationOverlay: () => void;

  constructor(uiManager: UIManager, conversationManager: ConversationManager) {
    this.uiManager = uiManager;
    this.conversationManager = conversationManager;
    this.updateConversationOverlay = () => {
      const currentNode = this.conversationManager.currentNode;
      if (currentNode) {
        this.uiManager.showConversation(currentNode);
      } else {
        this.uiManager.hideConversation();
      }
    };
    this.loadEvents();
  }

  private loadEvents(): void {
    this.eventsByTileId.clear();
    this.cooldownExpirations.clear();
    this.completedEvents.clear();

    const definitions: EventMapEntry[] = gameData.eventMap?.all ?? [];
    definitions.forEach((entry) => {
      this.eventsByTileId.set(entry.tileEventId, entry);
    });
  }

  public triggerEvent(tileEventId: number): void {
    const event = this.eventsByTileId.get(tileEventId);
    if (!event) {
      if (import.meta.env.DEV) {
        console.warn(`No event definition found for tile event ${tileEventId}`);
      }
      return;
    }

    if (!this.isEventAvailable(tileEventId, event)) {
      if (event.label) {
        this.uiManager.log(`${event.label}はまだ反応がない。`);
      }
      return;
    }

    if (event.type === 'conversation') {
      this.conversationManager.startConversation(
        event.conversationId,
        this.updateConversationOverlay,
        () => {
          this.applyEffects(event.effects);
          this.markEventTriggered(tileEventId, event);
        },
      );
      return;
    }

    this.applyEffects(event.effects);
    this.markEventTriggered(tileEventId, event);
  }

  private isEventAvailable(tileEventId: number, event: EventMapEntry): boolean {
    if (!event.repeatable && this.completedEvents.has(tileEventId)) {
      return false;
    }

    const cooldownReadyAt = this.cooldownExpirations.get(tileEventId);
    if (cooldownReadyAt !== undefined) {
      if (Date.now() < cooldownReadyAt) {
        return false;
      }
      this.cooldownExpirations.delete(tileEventId);
    }

    return true;
  }

  private markEventTriggered(tileEventId: number, event: EventMapEntry): void {
    if (!event.repeatable) {
      this.completedEvents.add(tileEventId);
      return;
    }

    if (event.cooldownMs && event.cooldownMs > 0) {
      this.cooldownExpirations.set(tileEventId, Date.now() + event.cooldownMs);
    }
  }

  private applyEffects(effects: EventMapEffect[]): void {
    effects.forEach((effect) => {
      switch (effect.type) {
        case 'log':
          this.uiManager.log(effect.message);
          break;
        case 'give_item': {
          const total = this.conversationManager.grantItem(effect.itemId, effect.quantity);
          this.uiManager.log(`${effect.itemId}を${effect.quantity}個入手した。（所持数: ${total}）`);
          break;
        }
        case 'set_flag':
          this.conversationManager.setFlag(effect.flagId, effect.value);
          break;
        case 'quest_update':
          this.conversationManager.updateQuest(effect.questId, effect.state);
          this.uiManager.log(`クエスト「${effect.questId}」が${effect.state}になった。`);
          break;
      }
    });
  }
}
