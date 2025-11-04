// spark-saga-repo-starter/src/managers/ConversationManager.ts
import { gameData } from '../data-loader';
import { eventsSchema, Event, EventNode } from '../schemas/event';

export interface ConversationGameState {
  region: string;
  er: number;
  party: string[];
  inventory: Record<string, number>;
  quests: Map<string, string>;
  flags: Map<string, boolean>;
}

const createDefaultGameState = (): ConversationGameState => ({
  region: 'tutorial',
  er: 1,
  party: ['hero'],
  inventory: { potion: 1 },
  quests: new Map<string, string>(),
  flags: new Map<string, boolean>(),
});

export class ConversationManager {
  private events: Map<string, Event> = new Map();
  private activeEvent: Event | null = null;
  public currentNode: EventNode | null = null;
  private flags: Map<string, boolean>;
  private gameState: ConversationGameState;
  private onStateChange: (() => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(gameState: ConversationGameState = createDefaultGameState()) {
    this.gameState = gameState;
    if (!this.gameState.flags) {
      this.gameState.flags = new Map<string, boolean>();
    }
    this.flags = this.gameState.flags;
    this.loadEvents();
  }

  public static async initialize(gameState: ConversationGameState = createDefaultGameState()) {
    const manager = new ConversationManager(gameState);
    return manager;
  }

  private loadEvents() {
    try {
      const data = gameData.event?.all ?? [];
      const parsedEvents = eventsSchema.parse(data);
      this.events.clear();
      for (const event of parsedEvents) {
        this.events.set(event.id, event);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  public startConversation(eventId: string, onStateChange?: () => void, onComplete?: () => void): EventNode | null {
    this.activeEvent = this.events.get(eventId) || null;
    this.onStateChange = onStateChange ?? null;
    this.onComplete = onComplete ?? null;
    if (this.activeEvent) {
      this.currentNode = this.activeEvent.nodes[0];
      this.processNode(this.currentNode);
    }
    if (this.onStateChange) {
      this.onStateChange();
    }
    return this.currentNode;
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
        this.setFlag(node.flag, node.value);
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'quest_start':
        this.updateQuest(node.quest_id, 'started');
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'quest_update':
        this.updateQuest(node.quest_id, node.quest_state);
        this.goToNode(node.next);
        shouldUpdateUI = false;
        break;
      case 'reward':
        this.grantItem(node.item_id, node.quantity);
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
    if (when.flags_has && !when.flags_has.every(flag => this.getFlag(flag))) return false;
    if (when.party_has && !when.party_has.every(member => this.gameState.party.includes(member))) return false;
    if (when.item_has && this.getItemQuantity(when.item_has.id) < when.item_has.quantity) return false;
    return true;
  }

  private endConversation() {
    this.activeEvent = null;
    this.currentNode = null;
    if (this.onStateChange) {
      this.onStateChange();
    }
    if (this.onComplete) {
      this.onComplete();
    }
    this.onComplete = null;
  }

  public setFlag(flag: string, value: boolean) {
    this.flags.set(flag, value);
  }

  public getFlag(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }

  public grantItem(itemId: string, quantity: number): number {
    const current = this.gameState.inventory[itemId] ?? 0;
    const next = current + quantity;
    this.gameState.inventory[itemId] = next;
    return next;
  }

  public getItemQuantity(itemId: string): number {
    return this.gameState.inventory[itemId] ?? 0;
  }

  public updateQuest(questId: string, state: string): void {
    this.gameState.quests.set(questId, state);
  }

  public getQuestState(questId: string): string | undefined {
    return this.gameState.quests.get(questId);
  }
}
