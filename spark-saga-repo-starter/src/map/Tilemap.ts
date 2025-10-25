// spark-saga-repo-starter/src/map/Tilemap.ts

export interface TilemapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: {
    name: string;
    data: number[];
  }[];
  tilesets: {
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
  }[];
}

export class Tilemap {
  private data: TilemapData;
  private tilesetImage: HTMLImageElement;

  constructor(data: TilemapData) {
    this.data = data;
    this.tilesetImage = new Image();
    // Assuming a single tileset for now
    this.tilesetImage.src = this.data.tilesets[0].image;
  }

  public render(ctx: CanvasRenderingContext2D, isDebugMode: boolean = false) {
    const { width, height, tileWidth, tileHeight, layers, tilesets } = this.data;
    const tileset = tilesets[0];

    for (const layer of layers) {
      if (layer.name === 'collision' || layer.name === 'events') {
        if (!isDebugMode) {
          continue;
        }
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tileIndex = layer.data[y * width + x];
          if (tileIndex === 0) {
            continue;
          }

          if (layer.name === 'collision') {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            continue;
          }

          if (layer.name === 'events') {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
            continue;
          }

          const sourceX = ((tileIndex - tileset.firstgid) % tileset.columns) * tileset.tilewidth;
          const sourceY = Math.floor((tileIndex - tileset.firstgid) / tileset.columns) * tileset.tileheight;

          ctx.drawImage(
            this.tilesetImage,
            sourceX,
            sourceY,
            tileset.tilewidth,
            tileset.tileheight,
            x * tileWidth,
            y * tileHeight,
            tileWidth,
            tileHeight
          );
        }
      }
    }
  }

  public isObstacle(x: number, y: number): boolean {
    const collisionLayer = this.data.layers.find(layer => layer.name === 'collision');
    if (!collisionLayer) {
      return false;
    }

    const tileX = Math.floor(x / this.data.tileWidth);
    const tileY = Math.floor(y / this.data.tileHeight);
    const tileIndex = collisionLayer.data[tileY * this.data.width + tileX];

    return tileIndex !== 0;
  }

  public getEvent(x: number, y: number): number | null {
      const eventLayer = this.data.layers.find(layer => layer.name === 'events');
      if (!eventLayer) {
          return null;
      }

      const tileX = Math.floor(x / this.data.tileWidth);
      const tileY = Math.floor(y / this.data.tileHeight);
      const eventId = eventLayer.data[tileY * this.data.width + tileX];

      return eventId !== 0 ? eventId : null;
  }
}
