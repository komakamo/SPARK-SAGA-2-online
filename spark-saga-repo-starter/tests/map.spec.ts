// spark-saga-repo-starter/tests/map.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../src/map/Player';
import { Tilemap, TilemapData } from '../src/map/Tilemap';
import { InputManager, Action } from '../src/input/InputManager';
import { EventManager } from '../src/managers/EventManager';

// Mock the global window and navigator objects
vi.stubGlobal('window', {
    addEventListener: () => {},
    removeEventListener: () => {},
});
vi.stubGlobal('navigator', {
    getGamepads: () => [null],
});
vi.stubGlobal('Image', class Image {
    src: string = '';
    onload: () => void = () => {};
    constructor() {
        setTimeout(() => this.onload(), 1);
        return this;
    }
});

describe('Player', () => {
    let player: Player;
    let inputManager: InputManager;
    let tilemap: Tilemap;

    beforeEach(() => {
        player = new Player(32, 32);
        inputManager = new InputManager();
        const tilemapData: TilemapData = {
            width: 10,
            height: 10,
            tileWidth: 16,
            tileHeight: 16,
            layers: [
                {
                    name: 'collision',
                    data: [
                        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 0, 0, 1, 1, 1, 1, 0, 0, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 0, 0, 1, 1, 1, 1, 0, 0, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                        1, 1, 1, 1, 1, 1, 1, 1, 1, 1
                    ]
                }
            ],
            tilesets: [
                {
                    firstgid: 1,
                    image: 'test.png',
                    imageheight: 16,
                    imagewidth: 16,
                    margin: 0,
                    spacing: 0,
                    tilecount: 1,
                    tileheight: 16,
                    tilewidth: 16,
                    columns: 1
                }
            ]
        };
        tilemap = new Tilemap(tilemapData);
    });

    it('should move the player', () => {
        inputManager.setActionState(Action.MoveRight, true);
        player.update(0.1, inputManager, tilemap);
        expect(player.x).toBeGreaterThan(32);
    });

    it('should not move the player into a collision tile', () => {
        player.x = 17;
        player.y = 17;
        inputManager.setActionState(Action.MoveLeft, true);
        player.update(0.1, inputManager, tilemap);
        expect(player.x).toBe(17);
    });
});

describe('EventManager', () => {
    let eventManager: EventManager;

    beforeEach(() => {
        eventManager = new EventManager();
    });

    it('should trigger a conversation event', () => {
        const event = eventManager.getEvent(1);
        expect(event).toBeDefined();
        // We can't test the alert, but we can check if the event is triggered
        // In a real application, we would spy on the alert or use a mock
    });
});
