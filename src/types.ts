export const AgentType = {
  Human: 0,
  Infected: 1,
  Zombie: 2,
  Dead: 3,
} as const;

export type AgentType = (typeof AgentType)[keyof typeof AgentType];

export const ZombieVariant = {
  Shambler: 0,
  Runner: 1,
  Tank: 2,
} as const;

export type ZombieVariant = (typeof ZombieVariant)[keyof typeof ZombieVariant];

export interface Vec2 {
  x: number;
  y: number;
}

export interface AgentState {
  id: number;
  type: AgentType;
  pos: Vec2;
  vel: Vec2;
  wanderAngle: number;
  incubationTimer: number;
  isPatientZero: boolean;
  trail: Vec2[];
  variant: ZombieVariant;
  hp: number;
  lifetime: number;
}

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}
