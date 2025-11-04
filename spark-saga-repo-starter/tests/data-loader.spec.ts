import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { gameData, loadGameData } from '../src/data-loader';

const dataRoot = path.resolve(__dirname, '../data');

describe('loadGameData', () => {
  it('loads and indexes core game data without fatal errors', async () => {
    Object.keys(gameData).forEach((key) => {
      delete gameData[key];
    });

    const originalFetch = global.fetch;
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

    try {
      const { logs } = await loadGameData();

      expect(logs.filter((log) => log.level === 'FATAL')).toHaveLength(0);
      expect(gameData.skill.all.length).toBeGreaterThan(0);
      expect(gameData.weapon.byId.get('iron_sword')?.name).toBe('Iron Sword');
      expect(gameData.formation.byId.size).toBeGreaterThan(0);
      expect(gameData.statusEffects.all.length).toBeGreaterThan(0);
      expect(gameData['i18n_en']).toBeDefined();
      expect(gameData['i18n_ja']).toBeDefined();
    } finally {
      if (originalFetch) {
        global.fetch = originalFetch;
      } else {
        // @ts-expect-error cleanup
        delete global.fetch;
      }
    }
  });
});
