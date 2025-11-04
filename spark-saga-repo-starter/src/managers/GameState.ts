import { gameData } from '../data-loader';
import { EncounterDefinition, EncounterQuestProgress, EncounterRewards } from '../schemas/encounter';
import { PartyDefinition } from '../schemas/party';

interface EncounterOutcome {
  encounterId: string;
  rewards: EncounterRewards;
  questProgress: EncounterQuestProgress[];
}

export class GameState {
  private activePartyId: string | null = null;
  private pendingOutcome: EncounterOutcome | null = null;
  public experience = 0;
  public gold = 0;
  public inventory: Map<string, number> = new Map();
  public questStates: Map<string, string> = new Map();

  initialize(): void {
    this.experience = 0;
    this.gold = 0;
    this.inventory.clear();
    this.questStates.clear();
    const parties: PartyDefinition[] = gameData.party?.all ?? [];
    if (parties.length > 0) {
      this.activePartyId = parties[0].id;
    }
  }

  setActiveParty(partyId: string): void {
    this.activePartyId = partyId;
  }

  getActiveParty(): PartyDefinition | null {
    if (!this.activePartyId) {
      return null;
    }
    return gameData.party?.byId.get(this.activePartyId) ?? null;
  }

  ensurePartyForEncounter(encounter: EncounterDefinition): PartyDefinition | null {
    if (encounter.playerPartyId) {
      this.activePartyId = encounter.playerPartyId;
    }
    return this.getActiveParty();
  }

  recordEncounterOutcome(encounterId: string, rewards: EncounterRewards, questProgress: EncounterQuestProgress[]): void {
    this.pendingOutcome = {
      encounterId,
      rewards,
      questProgress,
    };
  }

  consumeEncounterOutcome(): EncounterOutcome | null {
    const outcome = this.pendingOutcome;
    this.pendingOutcome = null;
    return outcome;
  }

  applyOutcome(outcome: EncounterOutcome): void {
    this.experience += outcome.rewards.experience;
    this.gold += outcome.rewards.gold;
    outcome.rewards.items.forEach((item) => {
      const current = this.inventory.get(item.id) ?? 0;
      this.inventory.set(item.id, current + item.quantity);
    });
    outcome.questProgress.forEach((progress) => {
      this.questStates.set(progress.questId, progress.state);
    });
  }
}

export const gameState = new GameState();
