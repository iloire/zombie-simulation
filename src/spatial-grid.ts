import type { AgentState } from './types.ts';

export class SpatialGrid {
  private cells: Map<number, AgentState[]> = new Map();
  private cols: number;
  private rows: number;
  private cellSize: number;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
  }

  clear(): void {
    this.cells.clear();
  }

  insert(agent: AgentState): void {
    const key = this.keyFor(agent.pos.x, agent.pos.y);
    let bucket = this.cells.get(key);
    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }
    bucket.push(agent);
  }

  query(x: number, y: number): AgentState[] {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    const result: AgentState[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue;
        const bucket = this.cells.get(r * this.cols + c);
        if (bucket) {
          for (const agent of bucket) {
            result.push(agent);
          }
        }
      }
    }

    return result;
  }

  resize(width: number, height: number): void {
    this.cols = Math.ceil(width / this.cellSize);
    this.rows = Math.ceil(height / this.cellSize);
  }

  private keyFor(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return row * this.cols + col;
  }
}
