export const AgentType = {
  Human: 0,
  Infected: 1,
  Zombie: 2,
  Dead: 3,
} as const;

export type AgentType = (typeof AgentType)[keyof typeof AgentType];

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
  incubationTimer: number; // frames remaining until infected → zombie
  isPatientZero: boolean;
  trail: Vec2[]; // recent positions for trail rendering
}
