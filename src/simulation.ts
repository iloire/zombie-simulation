import type { AgentState, Obstacle } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import { createAgent, updateAgent, checkInfection, resetIdCounter } from './agent.ts';
import { SpatialGrid } from './spatial-grid.ts';

export interface SimStats {
  humans: number;
  infected: number;
  zombies: number;
  dead: number;
  elapsed: number;
}

export interface PopSample {
  humans: number;
  infected: number;
  zombies: number;
}

export class Simulation {
  agents: AgentState[] = [];
  obstacles: Obstacle[] = [];
  grid: SpatialGrid;
  width: number;
  height: number;
  frame = 0;
  history: PopSample[] = [];
  lastInfections = 0; // infections this tick (for sound)

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = new SpatialGrid(width, height, CONFIG.cellSize);
    this.init();
  }

  init(): void {
    this.agents = [];
    this.frame = 0;
    this.history = [];
    resetIdCounter();

    this.generateObstacles();

    const margin = 40;

    for (let i = 0; i < CONFIG.initialHumans; i++) {
      let x: number, y: number;
      let attempts = 0;
      // Don't spawn inside obstacles
      do {
        x = margin + Math.random() * (this.width - margin * 2);
        y = margin + Math.random() * (this.height - margin * 2);
        attempts++;
      } while (this.insideObstacle(x, y) && attempts < 50);
      this.agents.push(createAgent(AgentType.Human, x, y));
    }

    for (let i = 0; i < CONFIG.initialZombies; i++) {
      const agent = createAgent(
        AgentType.Zombie,
        this.width / 2 + (Math.random() - 0.5) * 20,
        this.height / 2 + (Math.random() - 0.5) * 20,
        true,
      );
      this.agents.push(agent);
    }
  }

  private generateObstacles(): void {
    this.obstacles = [];
    const count = 8 + Math.floor(Math.random() * 6);
    const margin = 60;

    for (let i = 0; i < count; i++) {
      const w = 40 + Math.random() * 100;
      const h = 30 + Math.random() * 80;
      const x = margin + Math.random() * (this.width - margin * 2 - w);
      const y = margin + Math.random() * (this.height - margin * 2 - h);

      // Don't place too close to center (patient zero spawn)
      const cx = x + w / 2;
      const cy = y + h / 2;
      const dx = cx - this.width / 2;
      const dy = cy - this.height / 2;
      if (dx * dx + dy * dy < 100 * 100) continue;

      this.obstacles.push({ x, y, w, h });
    }
  }

  private insideObstacle(x: number, y: number): boolean {
    for (const obs of this.obstacles) {
      if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
        return true;
      }
    }
    return false;
  }

  get nightFactor(): number {
    // 0 = full day, 1 = full night (sine wave)
    const t = (this.frame % CONFIG.dayNightCycleDuration) / CONFIG.dayNightCycleDuration;
    return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  }

  tick(): void {
    this.frame++;

    this.grid.clear();
    for (const agent of this.agents) {
      if (agent.type !== AgentType.Dead) {
        this.grid.insert(agent);
      }
    }

    const night = this.nightFactor;
    for (const agent of this.agents) {
      updateAgent(agent, this.grid, this.width, this.height, this.obstacles, night);
    }

    this.lastInfections = checkInfection(this.agents);

    // Record history for sparkline
    if (this.frame % CONFIG.sparklineSampleInterval === 0) {
      const stats = this.getStats();
      this.history.push({
        humans: stats.humans,
        infected: stats.infected,
        zombies: stats.zombies,
      });
      if (this.history.length > CONFIG.sparklineMaxSamples) {
        this.history.shift();
      }
    }
  }

  addZombie(x: number, y: number): void {
    if (!this.insideObstacle(x, y)) {
      this.agents.push(createAgent(AgentType.Zombie, x, y));
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.grid.resize(width, height);
  }

  getStats(): SimStats {
    let humans = 0;
    let infected = 0;
    let zombies = 0;
    let dead = 0;

    for (const agent of this.agents) {
      switch (agent.type) {
        case AgentType.Human: humans++; break;
        case AgentType.Infected: infected++; break;
        case AgentType.Zombie: zombies++; break;
        case AgentType.Dead: dead++; break;
      }
    }

    return { humans, infected, zombies, dead, elapsed: this.frame };
  }
}
