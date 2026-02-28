import type { AgentState, Vec2 } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import { sub, normalize, scale, add, distSq, vec2, length } from './vec2.ts';

/** Random wander: smoothly varying angle */
export function wander(agent: AgentState): Vec2 {
  agent.wanderAngle += (Math.random() - 0.5) * 2 * CONFIG.wanderJitter;
  return vec2(Math.cos(agent.wanderAngle), Math.sin(agent.wanderAngle));
}

/** Seek: steer toward a target position */
export function seek(agent: AgentState, target: Vec2): Vec2 {
  const desired = sub(target, agent.pos);
  return normalize(desired);
}

/** Flee: steer away from the nearest threat */
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

/** Seek nearest human for zombies */
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

/** Separation: push away from very close agents */
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
      // Weight inversely by distance
      const weight = 1 - Math.sqrt(d) / CONFIG.separationRadius;
      force = add(force, scale(away, weight));
      count++;
    }
  }

  return count > 0 ? normalize(force) : force;
}

/** Cohesion: steer toward centroid of nearby same-type agents */
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
