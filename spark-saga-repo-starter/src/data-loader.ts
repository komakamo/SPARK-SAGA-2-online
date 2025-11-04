/**
 * @fileoverview
 * This module is responsible for loading, validating, and processing all game data.
 */

import { z } from 'zod';

// Define the structure for log entries
export type LogEntry = {
  level: 'FATAL' | 'WARN';
  code: string;
  id?: string;
  msg: string;
};

// This will hold all the validated and indexed game data
export const gameData: { [key: string]: any } = {};

// List of all data files to be loaded
const DATA_FILES = [
  'armor.json',
  'balance.json',
  'encounter.json',
  'enemy.json',
  'er.json',
  'event.json',
  'event-map.json',
  'faction.json',
  'formation.json',
  'status-effect.json',
  'item.json',
  'loot_table.json',
  'party.json',
  'quest.json',
  'shop.json',
  'skill.json',
  'weapon.json',
  'i18n/en.json',
  'i18n/ja.json',
];

/**
 * Fetches and parses a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<any>} The parsed JSON data.
 */
async function fetchJSON(filePath: string): Promise<any> {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * The main data loading function. This will be called at the start of the game.
 * @returns {Promise<{logs: LogEntry[]}>} An object containing the logs.
 */
export async function loadGameData(): Promise<{ logs: LogEntry[] }> {
  const logs: LogEntry[] = [];
  const rawData: { [key: string]: any } = {};

  // 1. Fetch all data files
  try {
    const dataPromises = DATA_FILES.map(async (file) => {
      try {
        rawData[file] = await fetchJSON(`data/${file}`);
      } catch (error) {
        logs.push({
          level: 'FATAL',
          code: 'FILE_NOT_FOUND',
          msg: `Failed to load essential data file: ${file}`,
        });
      }
    });
    await Promise.all(dataPromises);
  } catch (error) {
    // This catch is for systemic errors, but individual file errors are handled above.
    logs.push({
      level: 'FATAL',
      code: 'UNEXPECTED_ERROR',
      msg: 'An unexpected error occurred while fetching data files.',
    });
    return { logs };
  }

  // If any files failed to load, stop here.
  if (logs.some(log => log.level === 'FATAL')) {
    return { logs };
  }

  // 2. Schema validation
  const schemaModules = {
    'skill.json': async () => (await import('./schemas/skill')).skillsSchema,
    'weapon.json': async () => (await import('./schemas/weapon')).weaponsSchema,
    'armor.json': async () => (await import('./schemas/armor')).armorsSchema,
    'item.json': async () => (await import('./schemas/item')).itemsSchema,
    'enemy.json': async () => (await import('./schemas/enemy')).enemiesSchema,
    'encounter.json': async () => (await import('./schemas/encounter')).encountersSchema,
    'formation.json': async () => (await import('./schemas/formation')).formationsSchema,
    'event.json': async () => (await import('./schemas/event')).eventsSchema,
    'event-map.json': async () => (await import('./schemas/event-map')).eventMapSchema,
    'party.json': async () => (await import('./schemas/party')).partiesSchema,
    'quest.json': async () => (await import('./schemas/quest')).questsSchema,
    'shop.json': async () => (await import('./schemas/shop')).shopsSchema,
    'faction.json': async () => (await import('./schemas/faction')).factionsSchema,
    'loot_table.json': async () => (await import('./schemas/loot_table')).lootTablesSchema,
    'balance.json': async () => (await import('./schemas/balance')).balanceSchema,
    'er.json': async () => (await import('./schemas/er')).erSchema,
    'status-effect.json': async () => (await import('./schemas/status-effect')).statusEffectsSchema,
    'i18n/ja.json': async () => (await import('./schemas/i18n')).i18nSchema,
    'i18n/en.json': async () => (await import('./schemas/i18n')).i18nSchema,
  };

  for (const file in schemaModules) {
    if (rawData[file]) {
      try {
        const schema = await schemaModules[file]();
        schema.parse(rawData[file]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(issue => {
            logs.push({
              level: 'FATAL',
              code: 'SCHEMA_VALIDATION_ERROR',
              msg: `Schema validation failed for ${file}: ${issue.path.join('.')} - ${issue.message}`,
            });
          });
        } else {
          logs.push({
            level: 'FATAL',
            code: 'SCHEMA_LOADING_ERROR',
            msg: `Failed to load or parse schema for ${file}.`,
          });
        }
      }
    }
  }

  if (logs.some(log => log.level === 'FATAL')) {
    return { logs };
  }

  // 3. Referential integrity checks
  const skillIds = new Set(rawData['skill.json'].map((s: any) => s.id));
  const weaponIds = new Set(rawData['weapon.json'].map((w: any) => w.id));
  const armorIds = new Set(rawData['armor.json'].map((a: any) => a.id));
  const itemIds = new Set(rawData['item.json'].map((i: any) => i.id));
  const questIds = new Set(rawData['quest.json'].map((q: any) => q.id));
  const eventIds = new Set(rawData['event.json'].map((event: any) => event.id));
  const balanceAffixKeys = new Set(rawData['balance.json'].affix_keys ?? []);
  const formationIds = new Set(rawData['formation.json'].map((f: any) => f.id));
  const statusEffectIds = new Set(rawData['status-effect.json'].map((se: any) => se.id));
  const lootTableIds = new Set(rawData['loot_table.json'].map((lt: any) => lt.id));
  const partyIds = rawData['party.json']
    ? new Set(rawData['party.json'].map((p: any) => p.id))
    : new Set<string>();

  rawData['skill.json'].forEach((skill: any) => {
    skill.statusEffects?.forEach((statusId: string) => {
      if (!statusEffectIds.has(statusId)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_STATUS_REFERENCE',
          id: skill.id,
          msg: `Skill "${skill.id}" references non-existent status effect "${statusId}"`,
        });
      }
    });
  });

  // Check enemy skills
  rawData['enemy.json'].forEach((enemy: any) => {
    if (enemy.skills) {
      enemy.skills.forEach((skillId: string) => {
        if (!skillIds.has(skillId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_SKILL_REFERENCE',
            id: enemy.id,
            msg: `Enemy "${enemy.id}" references non-existent skill "${skillId}"`,
          });
        }
      });
    }
  });

  if (rawData['party.json']) {
    rawData['party.json'].forEach((party: any) => {
      if (!formationIds.has(party.formation)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_FORMATION_REFERENCE',
          id: party.id,
          msg: `Party "${party.id}" references non-existent formation "${party.formation}"`,
        });
      }

      party.members.forEach((member: any) => {
        if (member.equipment?.weapon && !weaponIds.has(member.equipment.weapon)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_WEAPON_REFERENCE',
            id: member.id,
            msg: `Party member "${member.id}" references missing weapon "${member.equipment.weapon}"`,
          });
        }

        if (member.equipment?.armor && !armorIds.has(member.equipment.armor)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_ARMOR_REFERENCE',
            id: member.id,
            msg: `Party member "${member.id}" references missing armor "${member.equipment.armor}"`,
          });
        }

        member.commands?.forEach((command: any) => {
          if (command.type === 'skill' && command.skills) {
            command.skills.forEach((skillId: string) => {
              if (!skillIds.has(skillId)) {
                logs.push({
                  level: 'WARN',
                  code: 'DANGLING_SKILL_REFERENCE',
                  id: member.id,
                  msg: `Party member "${member.id}" references non-existent skill "${skillId}"`,
                });
              }
            });
          }

          if (command.type === 'item' && command.items) {
            command.items.forEach((item: any) => {
              if (!itemIds.has(item.id)) {
                logs.push({
                  level: 'WARN',
                  code: 'DANGLING_ITEM_REFERENCE',
                  id: member.id,
                  msg: `Party member "${member.id}" references non-existent item "${item.id}"`,
                });
              }
            });
          }
        });
      });
    });
  }

  if (rawData['encounter.json']) {
    rawData['encounter.json'].forEach((encounter: any) => {
      if (encounter.playerPartyId && !partyIds.has(encounter.playerPartyId)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_PARTY_REFERENCE',
          id: encounter.id,
          msg: `Encounter "${encounter.id}" references non-existent party "${encounter.playerPartyId}"`,
        });
      }

      encounter.enemies.forEach((entry: any) => {
        if (!rawData['enemy.json'].some((enemy: any) => enemy.id === entry.enemyId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_ENEMY_REFERENCE',
            id: encounter.id,
            msg: `Encounter "${encounter.id}" references non-existent enemy "${entry.enemyId}"`,
          });
        }
      });

      encounter.rewards?.items?.forEach((item: any) => {
        if (!itemIds.has(item.id)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_ITEM_REFERENCE',
            id: encounter.id,
            msg: `Encounter "${encounter.id}" reward references non-existent item "${item.id}"`,
          });
        }
      });

      encounter.rewards?.lootTables?.forEach((tableId: string) => {
        if (!lootTableIds.has(tableId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_LOOT_TABLE_REFERENCE',
            id: encounter.id,
            msg: `Encounter "${encounter.id}" references non-existent loot table "${tableId}"`,
          });
        }
      });

      encounter.questProgress?.forEach((progress: any) => {
        if (!questIds.has(progress.questId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_QUEST_REFERENCE',
            id: encounter.id,
            msg: `Encounter "${encounter.id}" references non-existent quest "${progress.questId}"`,
          });
        }
      });
    });
  }

  // Check weapon op
  rawData['weapon.json'].forEach((weapon: any) => {
    if (weapon.op) {
      weapon.op.forEach((op: string) => {
        if (!balanceAffixKeys.has(op)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_AFFIX_KEY_REFERENCE',
            id: weapon.id,
            msg: `Weapon "${weapon.id}" references non-existent affix key "${op}"`,
          });
        }
      });
    }
  });

  // Check event nodes
  rawData['event.json'].forEach((event: any) => {
    event.nodes.forEach((node: any) => {
      if (!questIds.has(node.quest_id)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_QUEST_REFERENCE',
          id: event.id,
          msg: `Event "${event.id}" references non-existent quest "${node.quest_id}"`,
        });
      }
    });
  });

  if (rawData['event-map.json']) {
    rawData['event-map.json'].forEach((entry: any) => {
      if (entry.type === 'conversation' && !eventIds.has(entry.conversationId)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_EVENT_REFERENCE',
          id: entry.id,
          msg: `Event map entry "${entry.id}" references non-existent conversation "${entry.conversationId}"`,
        });
      }

      entry.effects?.forEach((effect: any) => {
        if (effect.type === 'give_item' && !itemIds.has(effect.itemId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_ITEM_REFERENCE',
            id: entry.id,
            msg: `Event map entry "${entry.id}" references non-existent item "${effect.itemId}"`,
          });
        }
        if (effect.type === 'quest_update' && !questIds.has(effect.questId)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_QUEST_REFERENCE',
            id: entry.id,
            msg: `Event map entry "${entry.id}" references non-existent quest "${effect.questId}"`,
          });
        }
      });
    });
  }

  // Check quest rewards
  rawData['quest.json'].forEach((quest: any) => {
    if (quest.rewards && quest.rewards.items) {
      quest.rewards.items.forEach((item: any) => {
        if (!itemIds.has(item.id)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_ITEM_REFERENCE',
            id: quest.id,
            msg: `Quest "${quest.id}" references non-existent item "${item.id}"`,
          });
        }
      });
    }
  });

  // Check loot tables
  rawData['loot_table.json'].forEach((lootTable: any) => {
    lootTable.entries.forEach((entry: any) => {
      if (!itemIds.has(entry.item_id)) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_ITEM_REFERENCE',
          id: lootTable.id,
          msg: `Loot table "${lootTable.id}" references non-existent item "${entry.item_id}"`,
        });
      }
    });
  });

  // Check shops
  rawData['shop.json'].forEach((shop: any) => {
    shop.items.forEach((item: any) => {
      const isValid =
        (item.type === 'item' && itemIds.has(item.id)) ||
        (item.type === 'weapon' && weaponIds.has(item.id)) ||
        (item.type === 'armor' && armorIds.has(item.id));
      if (!isValid) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_ITEM_REFERENCE',
          id: shop.id,
          msg: `Shop "${shop.id}" references non-existent item "${item.id}" of type "${item.type}"`,
        });
      }
    });
  });

  // Check factions
  rawData['faction.json'].forEach((faction: any) => {
    faction.thresholds.forEach((threshold: any) => {
      threshold.effects.forEach((effect: any) => {
        if (effect.unlock_quest_id && !questIds.has(effect.unlock_quest_id)) {
          logs.push({
            level: 'WARN',
            code: 'DANGLING_QUEST_REFERENCE',
            id: faction.id,
            msg: `Faction "${faction.id}" references non-existent quest "${effect.unlock_quest_id}"`,
          });
        }
      });
    });
  });

  // Check ER
  Object.entries(rawData['er.json'].effects).forEach(([key, effects]: [string, any]) => {
    effects.forEach((effect: any) => {
      const idExists = [...skillIds, ...weaponIds, ...armorIds, ...itemIds, ...questIds].some(id => id === effect.target_id);
      if (!idExists) {
        logs.push({
          level: 'WARN',
          code: 'DANGLING_ER_TARGET_ID_REFERENCE',
          id: key,
          msg: `ER effect "${key}" references non-existent target_id "${effect.target_id}"`,
        });
      }
    });
  });


  // 4. Index data for fast lookups
  const keyOverrides: Record<string, string> = {
    'status-effect.json': 'statusEffects',
    'event-map.json': 'eventMap',
  };

  for (const file in rawData) {
    const key =
      keyOverrides[file] ?? file.replace('.json', '').replace('i18n/', 'i18n_').replace(/-/g, '');
    if (Array.isArray(rawData[file])) {
      if (file === 'event-map.json') {
        gameData[key] = {
          byId: new Map(rawData[file].map((item: any) => [item.id, item])),
          byTileEventId: new Map(rawData[file].map((item: any) => [item.tileEventId, item])),
          all: rawData[file],
        };
      } else {
        gameData[key] = {
          byId: new Map(rawData[file].map((item: any) => [item.id, item])),
          all: rawData[file],
        };
      }
    } else {
      gameData[key] = rawData[file];
    }
  }

  console.log('Game data loaded successfully.');
  return { logs };
}
