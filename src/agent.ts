import type { AgentState } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import { vec2, add, scale, limit } from './vec2.ts';
import { wander, flee, seekNearest, separation, cohesion } from './steering.ts';
import type { SpatialGrid } from './spatial-grid.ts';

let nextId = 0;

export function createAgent(
  type: AgentType,
  x: number,
  y: number,
  isPatientZero = false,
): AgentState {
  const angle = Math.random() * Math.PI * 2;
  return {
    id: nextId++,
    type,
    pos: vec2(x, y),
    vel: vec2(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5),
    wanderAngle: angle,
    incubationTimer: 0,
    isPatientZero,
    trail: [],
  };
}

export function resetIdCounter(): void {
  nextId = 0;
}

function maxSpeed(agent: AgentState): number {
  switch (agent.type) {
    case AgentType.Human: return CONFIG.humanSpeed;
    case AgentType.Infected: return CONFIG.infectedSpeed;
    case AgentType.Zombie: return CONFIG.zombieSpeed;
    case AgentType.Dead: return 0;
  }
}

export function updateAgent(
  agent: AgentState,
  grid: SpatialGrid,
  width: number,
  height: number,
): void {
  if (agent.type === AgentType.Dead) return;

  // Handle incubation
  if (agent.type === AgentType.Infected) {
    agent.incubationTimer--;
    if (agent.incubationTimer <= 0) {
      agent.type = AgentType.Zombie;
    }
  }

  const neighbors = grid.query(agent.pos.x, agent.pos.y);
  let force = vec2(0, 0);

  // Compute steering forces based on type
  if (agent.type === AgentType.Human) {
    const fleeForce = flee(agent, neighbors, CONFIG.humanFleeRadius);
    const sepForce = separation(agent, neighbors);
    const cohForce = cohesion(agent, neighbors);
    const wanderForce = wander(agent);

    force = add(force, scale(fleeForce, CONFIG.fleeWeight));
    force = add(force, scale(sepForce, CONFIG.separationWeight));
    force = add(force, scale(cohForce, CONFIG.cohesionWeight));
    force = add(force, scale(wanderForce, CONFIG.wanderWeight));
  } else if (agent.type === AgentType.Zombie) {
    const seekForce = seekNearest(agent, neighbors, CONFIG.zombieSeekRadius);
    const sepForce = separation(agent, neighbors);
    const cohForce = cohesion(agent, neighbors);
    const wanderForce = wander(agent);

    force = add(force, scale(seekForce, CONFIG.seekWeight));
    force = add(force, scale(sepForce, CONFIG.separationWeight));
    force = add(force, scale(cohForce, CONFIG.zombieCohesionWeight));
    force = add(force, scale(wanderForce, CONFIG.wanderWeight));
  } else if (agent.type === AgentType.Infected) {
    // Erratic movement
    const wanderForce = wander(agent);
    const sepForce = separation(agent, neighbors);
    force = add(force, scale(wanderForce, CONFIG.wanderWeight * 1.5));
    force = add(force, scale(sepForce, CONFIG.separationWeight));
  }

  // Apply force to velocity
  const speed = maxSpeed(agent);
  agent.vel = limit(add(agent.vel, scale(force, 0.15)), speed);

  // Store trail position
  agent.trail.push({ x: agent.pos.x, y: agent.pos.y });
  if (agent.trail.length > CONFIG.trailLength) {
    agent.trail.shift();
  }

  // Update position
  agent.pos = add(agent.pos, agent.vel);

  // Bounce off edges
  const r = CONFIG.agentRadius;
  if (agent.pos.x < r) { agent.pos.x = r; agent.vel.x *= -1; }
  if (agent.pos.x > width - r) { agent.pos.x = width - r; agent.vel.x *= -1; }
  if (agent.pos.y < r) { agent.pos.y = r; agent.vel.y *= -1; }
  if (agent.pos.y > height - r) { agent.pos.y = height - r; agent.vel.y *= -1; }
}

/** Check if zombie bites human → infect */
export function checkInfection(agents: AgentState[]): void {
  const biteRangeSq = CONFIG.biteRange * CONFIG.biteRange;

  for (const zombie of agents) {
    if (zombie.type !== AgentType.Zombie) continue;

    for (const target of agents) {
      if (target.type !== AgentType.Human) continue;

      const dx = zombie.pos.x - target.pos.x;
      const dy = zombie.pos.y - target.pos.y;
      if (dx * dx + dy * dy < biteRangeSq) {
        target.type = AgentType.Infected;
        target.incubationTimer =
          CONFIG.incubationFrames.min +
          Math.random() * (CONFIG.incubationFrames.max - CONFIG.incubationFrames.min);
      }
    }
  }
}
