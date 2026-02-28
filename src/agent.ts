import type { AgentState, Obstacle } from './types.ts';
import { AgentType, ZombieVariant } from './types.ts';
import { CONFIG } from './config.ts';
import { vec2, add, scale, limit } from './vec2.ts';
import { wander, flee, seekNearest, separation, cohesion, avoidObstacles } from './steering.ts';
import type { SpatialGrid } from './spatial-grid.ts';

let nextId = 0;

export function createAgent(
  type: AgentType,
  x: number,
  y: number,
  isPatientZero = false,
  variant: ZombieVariant = ZombieVariant.Shambler,
): AgentState {
  const angle = Math.random() * Math.PI * 2;
  let hp = 1;
  if (type === AgentType.Zombie) {
    switch (variant) {
      case ZombieVariant.Runner: hp = CONFIG.runnerHp; break;
      case ZombieVariant.Tank: hp = CONFIG.tankHp; break;
      default: hp = CONFIG.shamblerHp; break;
    }
  }

  return {
    id: nextId++,
    type,
    pos: vec2(x, y),
    vel: vec2(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5),
    wanderAngle: angle,
    incubationTimer: 0,
    isPatientZero,
    trail: [],
    variant,
    hp,
    lifetime: 0,
  };
}

export function resetIdCounter(): void {
  nextId = 0;
}

export function rollVariant(): ZombieVariant {
  const r = Math.random();
  const { shambler, runner } = CONFIG.variantWeights;
  if (r < shambler) return ZombieVariant.Shambler;
  if (r < shambler + runner) return ZombieVariant.Runner;
  return ZombieVariant.Tank;
}

function maxSpeed(agent: AgentState, nightFactor: number): number {
  switch (agent.type) {
    case AgentType.Human: return CONFIG.humanSpeed;
    case AgentType.Infected: return CONFIG.infectedSpeed;
    case AgentType.Zombie: {
      let base: number;
      switch (agent.variant) {
        case ZombieVariant.Runner: base = CONFIG.runnerSpeed; break;
        case ZombieVariant.Tank: base = CONFIG.tankSpeed; break;
        default: base = CONFIG.zombieSpeed; break;
      }
      return base * (1 + (nightFactor * (CONFIG.nightSpeedMultiplier - 1)));
    }
    case AgentType.Dead: return 0;
  }
}

export function agentRadius(agent: AgentState): number {
  if (agent.type === AgentType.Zombie && agent.variant === ZombieVariant.Tank) {
    return CONFIG.tankRadius;
  }
  return CONFIG.agentRadius;
}

export function updateAgent(
  agent: AgentState,
  grid: SpatialGrid,
  width: number,
  height: number,
  obstacles: Obstacle[],
  nightFactor: number,
): void {
  if (agent.type === AgentType.Dead) return;

  agent.lifetime++;

  // Runner lifespan — dies after a while
  if (agent.type === AgentType.Zombie && agent.variant === ZombieVariant.Runner) {
    if (agent.lifetime > CONFIG.runnerLifespan) {
      agent.type = AgentType.Dead;
      return;
    }
  }

  // Handle incubation
  if (agent.type === AgentType.Infected) {
    agent.incubationTimer--;
    if (agent.incubationTimer <= 0) {
      agent.type = AgentType.Zombie;
      agent.variant = rollVariant();
      agent.lifetime = 0;
      switch (agent.variant) {
        case ZombieVariant.Runner: agent.hp = CONFIG.runnerHp; break;
        case ZombieVariant.Tank: agent.hp = CONFIG.tankHp; break;
        default: agent.hp = CONFIG.shamblerHp; break;
      }
    }
  }

  const neighbors = grid.query(agent.pos.x, agent.pos.y);
  let force = vec2(0, 0);

  // Obstacle avoidance for all alive agents
  const obsForce = avoidObstacles(agent, obstacles);
  force = add(force, scale(obsForce, CONFIG.obstacleAvoidWeight));

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
    const wanderForce = wander(agent);
    const sepForce = separation(agent, neighbors);
    force = add(force, scale(wanderForce, CONFIG.wanderWeight * 1.5));
    force = add(force, scale(sepForce, CONFIG.separationWeight));
  }

  const speed = maxSpeed(agent, nightFactor);
  agent.vel = limit(add(agent.vel, scale(force, 0.15)), speed);

  agent.trail.push({ x: agent.pos.x, y: agent.pos.y });
  if (agent.trail.length > CONFIG.trailLength) {
    agent.trail.shift();
  }

  agent.pos = add(agent.pos, agent.vel);

  // Collide with obstacles
  const r = agentRadius(agent);
  for (const obs of obstacles) {
    const closestX = Math.max(obs.x, Math.min(agent.pos.x, obs.x + obs.w));
    const closestY = Math.max(obs.y, Math.min(agent.pos.y, obs.y + obs.h));
    const dx = agent.pos.x - closestX;
    const dy = agent.pos.y - closestY;
    const dSq = dx * dx + dy * dy;
    if (dSq < r * r && dSq > 0) {
      const d = Math.sqrt(dSq);
      const nx = dx / d;
      const ny = dy / d;
      agent.pos.x = closestX + nx * r;
      agent.pos.y = closestY + ny * r;
      // Reflect velocity
      const dot = agent.vel.x * nx + agent.vel.y * ny;
      agent.vel.x -= 2 * dot * nx;
      agent.vel.y -= 2 * dot * ny;
    }
  }

  // Bounce off edges
  if (agent.pos.x < r) { agent.pos.x = r; agent.vel.x *= -1; }
  if (agent.pos.x > width - r) { agent.pos.x = width - r; agent.vel.x *= -1; }
  if (agent.pos.y < r) { agent.pos.y = r; agent.vel.y *= -1; }
  if (agent.pos.y > height - r) { agent.pos.y = height - r; agent.vel.y *= -1; }
}

export function checkInfection(agents: AgentState[]): number {
  const biteRangeSq = CONFIG.biteRange * CONFIG.biteRange;
  let newInfections = 0;

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
        newInfections++;
      }
    }
  }

  return newInfections;
}
