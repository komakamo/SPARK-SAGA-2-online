// spark-saga-repo-starter/src/map/Tilemap.ts

export interface TileLayer {
  id: number;
  name: string;
  type: 'tilelayer';
  data: number[];
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
}

export interface TilesetDefinition {
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
  columns: number;
  name?: string;
}

export interface TilemapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  tileWidth?: number;
  tileHeight?: number;
  layers: TileLayer[];
  tilesets: TilesetDefinition[];
}

interface LoadedTileset {
  definition: TilesetDefinition;
  image: HTMLImageElement;
}

const FLIP_MASK = 0b11100000000000000000000000000000;

export class Tilemap {
  private data: TilemapData;
  private tilesets: LoadedTileset[];
  private tileWidth: number;
  private tileHeight: number;

  constructor(data: TilemapData) {
    this.data = data;
    this.tileWidth = data.tilewidth ?? data.tileWidth ?? 16;
    this.tileHeight = data.tileheight ?? data.tileHeight ?? 16;
    this.tilesets = data.tilesets
      .slice()
      .sort((a, b) => a.firstgid - b.firstgid)
      .map(tileset => {
        const image = new Image();
        image.src = tileset.image;
        return { definition: tileset, image };
      });
  }

  private resolveTileset(globalTileId: number): LoadedTileset | null {
    // Remove any flipping flags the editor may have set.
    const gid = globalTileId & ~FLIP_MASK;
    if (gid === 0) {
      return null;
    }

    let candidate: LoadedTileset | null = null;
    for (const tileset of this.tilesets) {
      if (gid >= tileset.definition.firstgid) {
        candidate = tileset;
      } else {
        break;
      }
    }
    return candidate;
  }

  public render(ctx: CanvasRenderingContext2D, isDebugMode: boolean = false) {
    const { layers } = this.data;

    for (const layer of layers) {
      if (layer.type !== 'tilelayer') {
        continue;
      }

      if ((layer.name === 'collision' || layer.name === 'events') && !isDebugMode) {
        continue;
      }

      const layerWidth = layer.width ?? this.data.width;
      const layerHeight = layer.height ?? this.data.height;

      for (let y = 0; y < layerHeight; y++) {
        for (let x = 0; x < layerWidth; x++) {
          const index = y * layerWidth + x;
          const tileIndex = layer.data[index];
          const gid = tileIndex & ~FLIP_MASK;

          if (gid === 0) {
            continue;
          }

          if (layer.name === 'collision') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(x * this.tileWidth, y * this.tileHeight, this.tileWidth, this.tileHeight);
            continue;
          }

          if (layer.name === 'events') {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(x * this.tileWidth, y * this.tileHeight, this.tileWidth, this.tileHeight);
            continue;
          }

          const tileset = this.resolveTileset(tileIndex);
          if (!tileset) {
            continue;
          }

          const localId = gid - tileset.definition.firstgid;
          const columns = tileset.definition.columns;
          const sourceX = (localId % columns) * tileset.definition.tilewidth;
          const sourceY = Math.floor(localId / columns) * tileset.definition.tileheight;

          ctx.drawImage(
            tileset.image,
            sourceX,
            sourceY,
            tileset.definition.tilewidth,
            tileset.definition.tileheight,
            x * this.tileWidth,
            y * this.tileHeight,
            this.tileWidth,
            this.tileHeight
          );
        }
      }
    }
  }

  private isWithinBounds(tileX: number, tileY: number): boolean {
    return tileX >= 0 && tileY >= 0 && tileX < this.data.width && tileY < this.data.height;
  }

  public isObstacle(x: number, y: number): boolean {
    const collisionLayer = this.data.layers.find(layer => layer.name === 'collision');
    if (!collisionLayer) {
      return false;
    }

    const tileX = Math.floor(x / this.tileWidth);
    const tileY = Math.floor(y / this.tileHeight);
    if (!this.isWithinBounds(tileX, tileY)) {
      return true;
    }

    const layerWidth = collisionLayer.width ?? this.data.width;
    const tileIndex = collisionLayer.data[tileY * layerWidth + tileX] & ~FLIP_MASK;

    return tileIndex !== 0;
  }

  public getEvent(x: number, y: number): number | null {
    const eventLayer = this.data.layers.find(layer => layer.name === 'events');
    if (!eventLayer) {
      return null;
    }

    const tileX = Math.floor(x / this.tileWidth);
    const tileY = Math.floor(y / this.tileHeight);
    if (!this.isWithinBounds(tileX, tileY)) {
      return null;
    }

    const layerWidth = eventLayer.width ?? this.data.width;
    const eventId = eventLayer.data[tileY * layerWidth + tileX] & ~FLIP_MASK;

    return eventId !== 0 ? eventId : null;
  }
}
