// spark-saga-repo-starter/tests/map.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../src/map/Player';
import { Tilemap, TilemapData } from '../src/map/Tilemap';
import { InputManager, Action } from '../src/input/InputManager';

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
            tilewidth: 16,
            tileheight: 16,
            layers: [
                {
                    id: 1,
                    name: 'collision',
                    type: 'tilelayer',
                    opacity: 1,
                    visible: true,
                    width: 10,
                    height: 10,
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
                },
                {
                    id: 2,
                    name: 'events',
                    type: 'tilelayer',
                    opacity: 1,
                    visible: true,
                    width: 10,
                    height: 10,
                    data: new Array(100).fill(0)
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

describe('Tilemap events', () => {
    it('returns the event id at the player position', () => {
        const tilemapData: TilemapData = {
            width: 2,
            height: 2,
            tilewidth: 16,
            tileheight: 16,
            layers: [
                {
                    id: 1,
                    name: 'ground',
                    type: 'tilelayer',
                    opacity: 1,
                    visible: true,
                    width: 2,
                    height: 2,
                    data: [1, 1, 1, 1]
                },
                {
                    id: 2,
                    name: 'collision',
                    type: 'tilelayer',
                    opacity: 1,
                    visible: true,
                    width: 2,
                    height: 2,
                    data: [0, 0, 0, 0]
                },
                {
                    id: 3,
                    name: 'events',
                    type: 'tilelayer',
                    opacity: 1,
                    visible: true,
                    width: 2,
                    height: 2,
                    data: [0, 1, 0, 0]
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
        const map = new Tilemap(tilemapData);
        expect(map.getEvent(16, 0)).toBe(1);
        expect(map.getEvent(0, 0)).toBeNull();
    });
});
