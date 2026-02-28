import type { AgentState, Vec2, Obstacle } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import { sub, normalize, scale, add, distSq, vec2, length } from './vec2.ts';

export function wander(agent: AgentState): Vec2 {
  agent.wanderAngle += (Math.random() - 0.5) * 2 * CONFIG.wanderJitter;
  return vec2(Math.cos(agent.wanderAngle), Math.sin(agent.wanderAngle));
}

export function seek(agent: AgentState, target: Vec2): Vec2 {
  const desired = sub(target, agent.pos);
  return normalize(desired);
}

export function flee(agent: AgentState, threats: AgentState[], radius: number): Vec2 {
  const radiusSq = radius * radius;
  let closestDist = Infinity;
  let closestThreat: AgentState | null = null;

  for (const t of threats) {
    if (t.type !== AgentType.Zombie && t.type !== AgentType.Infected) continue;
    const d = distSq(agent.pos, t.pos);
    if (d < radiusSq && d < closestDist) {
      closestDist = d;
      closestThreat = t;
    }
  }

  if (!closestThreat) return vec2(0, 0);

  const away = sub(agent.pos, closestThreat.pos);
  return normalize(away);
}

export function seekNearest(agent: AgentState, targets: AgentState[], radius: number): Vec2 {
  const radiusSq = radius * radius;
  let closestDist = Infinity;
  let closestTarget: AgentState | null = null;

  for (const t of targets) {
    if (t.type !== AgentType.Human && t.type !== AgentType.Infected) continue;
    const d = distSq(agent.pos, t.pos);
    if (d < radiusSq && d < closestDist) {
      closestDist = d;
      closestTarget = t;
    }
  }

  if (!closestTarget) return vec2(0, 0);
  return seek(agent, closestTarget.pos);
}

export function separation(agent: AgentState, neighbors: AgentState[]): Vec2 {
  const radiusSq = CONFIG.separationRadius * CONFIG.separationRadius;
  let force = vec2(0, 0);
  let count = 0;

  for (const n of neighbors) {
    if (n.id === agent.id) continue;
    if (n.type === AgentType.Dead) continue;
    const d = distSq(agent.pos, n.pos);
    if (d > 0 && d < radiusSq) {
      const away = normalize(sub(agent.pos, n.pos));
      const weight = 1 - Math.sqrt(d) / CONFIG.separationRadius;
      force = add(force, scale(away, weight));
      count++;
    }
  }

  return count > 0 ? normalize(force) : force;
}

export function cohesion(agent: AgentState, neighbors: AgentState[]): Vec2 {
  const radiusSq = CONFIG.cohesionRadius * CONFIG.cohesionRadius;
  let cx = 0;
  let cy = 0;
  let count = 0;

  for (const n of neighbors) {
    if (n.id === agent.id) continue;
    if (n.type !== agent.type) continue;
    const d = distSq(agent.pos, n.pos);
    if (d < radiusSq) {
      cx += n.pos.x;
      cy += n.pos.y;
      count++;
    }
  }

  if (count === 0) return vec2(0, 0);

  cx /= count;
  cy /= count;
  const desired = sub(vec2(cx, cy), agent.pos);
  return length(desired) > 0 ? normalize(desired) : vec2(0, 0);
}

export function avoidObstacles(agent: AgentState, obstacles: Obstacle[]): Vec2 {
  let force = vec2(0, 0);
  const lookAhead = 30;

  for (const obs of obstacles) {
    // Find closest point on obstacle rect to agent
    const closestX = Math.max(obs.x, Math.min(agent.pos.x, obs.x + obs.w));
    const closestY = Math.max(obs.y, Math.min(agent.pos.y, obs.y + obs.h));
    const dx = agent.pos.x - closestX;
    const dy = agent.pos.y - closestY;
    const dSq = dx * dx + dy * dy;

    if (dSq < lookAhead * lookAhead && dSq > 0) {
      const d = Math.sqrt(dSq);
      const weight = 1 - d / lookAhead;
      force = add(force, scale(vec2(dx / d, dy / d), weight));
    }
  }

  return length(force) > 0 ? normalize(force) : force;
}
