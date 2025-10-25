process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import fs from 'fs/promises';
import path from 'path';
import { ZodError, z } from 'zod';
import { zodSchemaToMarkdown } from 'zod-to-markdown';

const DATA_DIR = path.resolve(__dirname, '../data');

type ValidationResult = {
  file: string;
  errors: z.ZodIssue[];
};

// Function to validate a single file against a schema
async function validateFile(filePath: string, schema: z.ZodSchema<any>): Promise<ValidationResult> {
  const result: ValidationResult = { file: path.basename(filePath), errors: [] };
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      result.errors = error.issues;
    } else {
      throw error; // Re-throw other errors
    }
  }
  return result;
}

// Main schema validation function
async function validateSchemas() {
  console.log('Validating schemas...');
  const schemas = {
    'skill.json': (await import('../data/schemas/skill')).skillsSchema,
    'weapon.json': (await import('../data/schemas/weapon')).weaponsSchema,
    'armor.json': (await import('../data/schemas/armor')).armorsSchema,
    'item.json': (await import('../data/schemas/item')).itemsSchema,
    'enemy.json': (await import('../data/schemas/enemy')).enemiesSchema,
    'formation.json': (await import('../data/schemas/formation')).formationsSchema,
    'event.json': (await import('../data/schemas/event')).eventsSchema,
    'quest.json': (await import('../data/schemas/quest')).questsSchema,
    'shop.json': (await import('../data/schemas/shop')).shopsSchema,
    'faction.json': (await import('../data/schemas/faction')).factionsSchema,
    'loot_table.json': (await import('../data/schemas/loot_table')).lootTablesSchema,
    'balance.json': (await import('../data/schemas/balance')).balanceSchema,
    'er.json': (await import('../data/schemas/er')).erSchema,
    'i18n/ja.json': (await import('../data/schemas/i18n')).i18nSchema,
    'i18n/en.json': (await import('../data/schemas/i18n')).i18nSchema,
  };

  const validationPromises = Object.entries(schemas).map(([fileName, schema]) =>
    validateFile(path.join(DATA_DIR, fileName), schema)
  );

  const results = await Promise.all(validationPromises);
  const errors = results.filter((r) => r.errors.length > 0);

  if (errors.length > 0) {
    console.error('Schema validation failed:');
    for (const result of errors) {
      console.log(`\n--- Errors in ${result.file} ---`);
      for (const issue of result.errors) {
        console.log(`  - Path: ${issue.path.join('.')}, Message: ${issue.message}`);
      }
    }
    throw new Error('Schema validation failed.');
  } else {
    console.log('All schemas are valid.');
  }
}

async function validateIdConventions() {
  console.log('Validating ID conventions...');
  const filesToValidate = [
    'skill.json', 'weapon.json', 'armor.json', 'item.json', 'enemy.json',
    'formation.json', 'event.json', 'quest.json', 'shop.json', 'faction.json',
    'loot_table.json'
  ];

  let hasErrors = false;

  for (const fileName of filesToValidate) {
    const filePath = path.join(DATA_DIR, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) continue;

    const ids = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item.id !== 'string') continue;

      // Check for snake_case format
      if (!/^[a-z][a-z0-9_]*$/.test(item.id)) {
        console.error(`  - Invalid ID format in ${fileName} at index ${i}: "${item.id}" (must be snake_case)`);
        hasErrors = true;
      }

      // Check for uniqueness
      if (ids.has(item.id)) {
        console.error(`  - Duplicate ID in ${fileName}: "${item.id}"`);
        hasErrors = true;
      }
      ids.add(item.id);
    }
  }

  if (hasErrors) {
    throw new Error('ID convention validation failed.');
  } else {
    console.log('All ID conventions are valid.');
  }
}

async function validateReferentialIntegrity() {
  console.log('Validating referential integrity...');

  // Load all data files
  const [
    skills, weapons, armors, items, enemies, events, quests, shops, factions, lootTables, balance, er
  ] = await Promise.all([
    'skill.json', 'weapon.json', 'armor.json', 'item.json', 'enemy.json', 'event.json',
    'quest.json', 'shop.json', 'faction.json', 'loot_table.json', 'balance.json', 'er.json'
  ].map(file => fs.readFile(path.join(DATA_DIR, file), 'utf-8').then(JSON.parse)));

  // Create ID sets for efficient lookup
  const skillIds = new Set(skills.map((s: any) => s.id));
  const weaponIds = new Set(weapons.map((w: any) => w.id));
  const armorIds = new Set(armors.map((a: any) => a.id));
  const itemIds = new Set(items.map((i: any) => i.id));
  const questIds = new Set(quests.map((q: any) => q.id));
  const balanceAffixKeys = new Set((balance as any).affix_keys);

  let hasErrors = false;

  // Perform referential integrity checks
  for (const enemy of enemies) {
    if (enemy.skills) {
      for (const skillId of enemy.skills) {
        if (!skillIds.has(skillId)) {
          console.error(`  - Invalid skill ID "${skillId}" in enemy "${enemy.id}"`);
          hasErrors = true;
        }
      }
    }
  }

  for (const weapon of weapons) {
    if (weapon.op) {
      for (const op of weapon.op) {
        if (!balanceAffixKeys.has(op)) {
          console.error(`  - Invalid affix key "${op}" in weapon "${weapon.id}"`);
          hasErrors = true;
        }
      }
    }
  }

  for (const event of events) {
    for (const node of event.nodes) {
      if (!questIds.has(node.quest_id)) {
        console.error(`  - Invalid quest ID "${node.quest_id}" in event "${event.id}"`);
        hasErrors = true;
      }
    }
  }

  for (const quest of quests) {
    if (quest.rewards && quest.rewards.items) {
      for (const item of quest.rewards.items) {
        if (!itemIds.has(item.id)) {
          console.error(`  - Invalid item ID "${item.id}" in quest "${quest.id}" rewards`);
          hasErrors = true;
        }
      }
    }
  }

  for (const lootTable of lootTables) {
    for (const entry of lootTable.entries) {
      if (!itemIds.has(entry.item_id)) {
        console.error(`  - Invalid item ID "${entry.item_id}" in loot table "${lootTable.id}"`);
        hasErrors = true;
      }
    }
  }

  for (const shop of shops) {
    for (const item of shop.items) {
      const isValid = (
        (item.type === 'item' && itemIds.has(item.id)) ||
        (item.type === 'weapon' && weaponIds.has(item.id)) ||
        (item.type === 'armor' && armorIds.has(item.id))
      );
      if (!isValid) {
        console.error(`  - Invalid item ID "${item.id}" of type "${item.type}" in shop "${shop.id}"`);
        hasErrors = true;
      }
    }
  }

  for (const faction of factions) {
    for (const threshold of faction.thresholds) {
      for (const effect of threshold.effects) {
        if (effect.unlock_quest_id && !questIds.has(effect.unlock_quest_id)) {
          console.error(`  - Invalid quest ID "${effect.unlock_quest_id}" in faction "${faction.id}"`);
          hasErrors = true;
        }
      }
    }
  }

  // ER validation
  // This is a simplified example. A more robust implementation might be needed
  // depending on the complexity of the ER effects.
  for (const [key, effects] of Object.entries((er as any).effects)) {
    for (const effect of effects as any) {
        // A simple check to see if the target_id exists in any of the main data files.
        // This could be made more specific if the ER schema was more detailed.
        const idExists = [...skillIds, ...weaponIds, ...armorIds, ...itemIds, ...questIds].some(id => id === effect.target_id);
        if (!idExists) {
            console.error(`  - Invalid target_id "${effect.target_id}" in er.json`);
            hasErrors = true;
        }
    }
  }


  if (hasErrors) {
    throw new Error('Referential integrity validation failed.');
  } else {
    console.log('All referential integrity checks passed.');
  }
}

async function validateValueRanges() {
  console.log('Validating value ranges...');

  // Load relevant data files
  const [lootTables, shops] = await Promise.all([
    'loot_table.json', 'shop.json'
  ].map(file => fs.readFile(path.join(DATA_DIR, file), 'utf-8').then(JSON.parse)));

  let hasErrors = false;

  // Validate loot table chances (0 <= p <= 1)
  for (const lootTable of lootTables) {
    for (const entry of lootTable.entries) {
      if (entry.chance < 0 || entry.chance > 1) {
        console.error(`  - Invalid chance value "${entry.chance}" for item "${entry.item_id}" in loot table "${lootTable.id}" (must be between 0 and 1)`);
        hasErrors = true;
      }
    }
  }

  // Validate shop prices (>= 0)
  for (const shop of shops) {
    for (const item of shop.items) {
      if (item.price < 0) {
        console.error(`  - Invalid price "${item.price}" for item "${item.id}" in shop "${shop.id}" (must be non-negative)`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    throw new Error('Value range validation failed.');
  } else {
    console.log('All value range checks passed.');
  }
}

async function validateI18n() {
  console.log('Validating i18n key consistency...');

  const [ja, en] = await Promise.all([
    fs.readFile(path.join(DATA_DIR, 'i18n/ja.json'), 'utf-8').then(JSON.parse),
    fs.readFile(path.join(DATA_DIR, 'i18n/en.json'), 'utf-8').then(JSON.parse)
  ]);

  const jaKeys = Object.keys(ja);
  const enKeys = new Set(Object.keys(en));

  let hasMissingKeys = false;
  for (const key of jaKeys) {
    if (!enKeys.has(key)) {
      console.warn(`  - [MISSING:key] Key "${key}" exists in ja.json but is missing in en.json.`);
      hasMissingKeys = true;
    }
  }

  // Note: This is a warning, not an error, as per the requirements.
  if (hasMissingKeys) {
    console.log('i18n key consistency check completed with warnings.');
  } else {
    console.log('i18n key consistency check passed.');
  }
}

async function generateDocumentation() {
  console.log('Generating data model documentation...');
  const schemaFiles = [
    'skill', 'weapon', 'armor', 'item', 'enemy', 'formation', 'event', 'quest', 'shop', 'faction', 'loot_table', 'balance', 'er', 'i18n'
  ];

  let markdown = '# Data Model\n\n';

  for (const file of schemaFiles) {
    const module = await import(`../data/schemas/${file}`);
    const schemaName = Object.keys(module).find(key => key.endsWith('Schema'));
    if (schemaName) {
      const schema = module[schemaName];
      markdown += `## ${file}.json\n\n`;
      markdown += zodSchemaToMarkdown(schema);
      markdown += '\n';
    }
  }

  await fs.writeFile(path.resolve(__dirname, '../docs/DATA_MODEL.md'), markdown);
  console.log('Documentation generated successfully.');
}

async function main() {
  const errors: string[] = [];

  const runValidation = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      errors.push(`${name} failed: ${(error as Error).message}`);
    }
  };

  await runValidation('Schema validation', validateSchemas);
  await runValidation('ID convention validation', validateIdConventions);
  await runValidation('Referential integrity validation', validateReferentialIntegrity);
  await runValidation('Value range validation', validateValueRanges);
  await runValidation('i18n validation', validateI18n);

  if (errors.length > 0) {
    console.error('\nData validation failed with the following errors:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  await generateDocumentation();
  console.log('Data validation complete.');
}

main();
