// spark-saga-repo-starter/src/managers/EventManager.ts

export enum EventType {
  Conversation,
  TreasureChest,
  GatheringPoint,
}

export interface Event {
  id: number;
  type: EventType;
  data: any;
}

import { UIManager } from "../ui/UIManager";

export class EventManager {
  private events: Map<number, Event>;
  private triggeredEvents: Set<number>;
  private uiManager: UIManager;

  constructor(uiManager: UIManager) {
    this.events = new Map();
    this.triggeredEvents = new Set();
    this.uiManager = uiManager;
    this.initializeEvents();
  }

  private initializeEvents() {
    // This is where we would load event data from a file
    this.events.set(1, { id: 1, type: EventType.Conversation, data: { message: 'Hello!' } });
    this.events.set(2, { id: 2, type: EventType.TreasureChest, data: { itemId: 'potion', quantity: 1 } });
    this.events.set(3, { id: 3, type: EventType.GatheringPoint, data: { itemId: 'herb', cooldown: 10000 } });
  }

  public getEvent(id: number): Event | undefined {
    return this.events.get(id);
  }

  public triggerEvent(id: number) {
    if (this.triggeredEvents.has(id)) {
      return;
    }

    const event = this.getEvent(id);
    if (!event) {
      return;
    }

    switch (event.type) {
      case EventType.Conversation:
        this.uiManager.log(event.data.message);
        break;
      case EventType.TreasureChest:
        this.uiManager.log(`You found a ${event.data.itemId}!`);
        this.triggeredEvents.add(id);
        break;
      case EventType.GatheringPoint:
        this.uiManager.log(`You gathered an ${event.data.itemId}!`);
        setTimeout(() => {
          this.triggeredEvents.delete(id);
        }, event.data.cooldown);
        this.triggeredEvents.add(id);
        break;
    }
  }
}
