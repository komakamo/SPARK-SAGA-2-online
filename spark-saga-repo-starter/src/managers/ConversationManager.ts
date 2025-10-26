// spark-saga-repo-starter/src/managers/ConversationManager.ts
import { eventsSchema, Event, EventNode } from '../schemas/event';

// Mock game state for now
const defaultGameState = {
  region: 'tutorial',
  er: 1,
  party: ['hero'],
  inventory: { 'potion': 1 },
  quests: new Map<string, string>(),
};

export class ConversationManager {
  private events: Map<string, Event> = new Map();
  private activeEvent: Event | null = null;
  public currentNode: EventNode | null = null;
  private flags: Map<string, boolean> = new Map();
  private gameState: any;
  private onStateChange: (() => void) | null = null;

  private constructor(gameState: any = defaultGameState) {
    this.gameState = gameState;
  }

  public static async initialize(gameState: any = defaultGameState) {
    const manager = new ConversationManager(gameState);
    await manager.loadEvents();
    return manager;
  }

  private async loadEvents() {
    try {
      const response = await fetch('/data/event.json');
      const data = await response.json();
      const parsedEvents = eventsSchema.parse(data);
      for (const event of parsedEvents) {
        this.events.set(event.id, event);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  public startConversation(eventId: string, onStateChange: () => void) {
    this.activeEvent = this.events.get(eventId) || null;
    this.onStateChange = onStateChange;
    if (this.activeEvent) {
      this.currentNode = this.activeEvent.nodes[0];
      this.processNode(this.currentNode);
    }
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  public handleChoice(choiceIndex: number) {
    if (this.currentNode?.type === 'choice') {
      const choice = this.currentNode.choices[choiceIndex];
      this.goToNode(choice.next);
    }
  }

  public next() {
    if (this.currentNode && 'next' in this.currentNode && this.currentNode.next) {
      this.goToNode(this.currentNode.next);
    } else {
      this.endConversation();
    }
  }

  private goToNode(nodeId: string | null) {
    if (nodeId === null) {
      this.endConversation();
      return;
    }
    const targetNode = this.activeEvent?.nodes.find(node => 'id' in node && node.id === nodeId);
    this.currentNode = targetNode || null;
    if (this.currentNode) {
      this.processNode(this.currentNode);
    } else {
      this.endConversation();
    }
  }

  private processNode(node: EventNode) {
    if (node.when && !this.isConditionMet(node.when)) {
      this.next();
      return;
    }

    let shouldUpdateUI = true;

    switch (node.type) {
      case 'set_flag':
        this.flags.set(node.flag, node.value);
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'quest_start':
        this.gameState.quests.set(node.quest_id, 'started');
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'quest_update':
        this.gameState.quests.set(node.quest_id, node.quest_state);
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'reward':
        this.gameState.inventory[node.item_id] = (this.gameState.inventory[node.item_id] || 0) + node.quantity;
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'goto':
        this.goToNode(node.target);
        shouldUpdateUI = false;
        break;
      case 'battle':
        // This would trigger a battle, but for now we'll just log it
        console.log(`Starting battle with encounter ${node.encounter_id}`);
        this.goToNode(node.on_win); // Assume the player wins
        shouldUpdateUI = false;
        break;
    }

    if (shouldUpdateUI && this.onStateChange) {
      this.onStateChange();
    }
  }

  private isConditionMet(when: any): boolean {
    if (when.region && when.region !== this.gameState.region) return false;
    if (when.er_gte && when.er_gte > this.gameState.er) return false;
    if (when.flags_has && !when.flags_has.every(flag => this.flags.get(flag))) return false;
    if (when.party_has && !when.party_has.every(member => this.gameState.party.includes(member))) return false;
    if (when.item_has && (this.gameState.inventory[when.item_has.id] || 0) < when.item_has.quantity) return false;
    return true;
  }

  private endConversation() {
    this.activeEvent = null;
    this.currentNode = null;
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
