import type { AgentState } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import { createAgent, updateAgent, checkInfection, resetIdCounter } from './agent.ts';
import { SpatialGrid } from './spatial-grid.ts';

export interface SimStats {
  humans: number;
  infected: number;
  zombies: number;
  dead: number;
  elapsed: number; // frames
}

export class Simulation {
  agents: AgentState[] = [];
  grid: SpatialGrid;
  width: number;
  height: number;
  frame = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = new SpatialGrid(width, height, CONFIG.cellSize);
    this.init();
  }

  init(): void {
    this.agents = [];
    this.frame = 0;
    resetIdCounter();

    const margin = 40;

    // Spawn humans
    for (let i = 0; i < CONFIG.initialHumans; i++) {
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = margin + Math.random() * (this.height - margin * 2);
      this.agents.push(createAgent(AgentType.Human, x, y));
    }

    // Spawn patient zero at center
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

  tick(): void {
    this.frame++;

    // Rebuild spatial grid
    this.grid.clear();
    for (const agent of this.agents) {
      if (agent.type !== AgentType.Dead) {
        this.grid.insert(agent);
      }
    }

    // Update all agents
    for (const agent of this.agents) {
      updateAgent(agent, this.grid, this.width, this.height);
    }

    // Check infections
    checkInfection(this.agents);

    // Remove dead agents that have fully faded (optional cleanup)
    // For now we keep them for rendering
  }

  addZombie(x: number, y: number): void {
    this.agents.push(createAgent(AgentType.Zombie, x, y));
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
