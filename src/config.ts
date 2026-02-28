export const CONFIG = {
  // Population
  initialHumans: 300,
  initialZombies: 1,

  // Agent sizes
  agentRadius: 4,

  // Speeds (px/frame)
  humanSpeed: 2.2,
  infectedSpeed: 1.2,
  zombieSpeed: 1.4,

  // Perception radii (px)
  humanFleeRadius: 120,
  zombieSeekRadius: 200,
  cohesionRadius: 60,
  separationRadius: 16,

  // Infection
  biteRange: 10,
  incubationFrames: { min: 300, max: 900 }, // 5–15 seconds at 60fps

  // Steering weights
  fleeWeight: 3.0,
  seekWeight: 2.0,
  separationWeight: 2.5,
  cohesionWeight: 0.3,
  wanderWeight: 0.8,
  zombieCohesionWeight: 0.15,

  // Wander
  wanderJitter: 0.3, // radians per frame max change

  // Trails
  trailLength: 8,

  // Spatial grid
  cellSize: 200, // should be >= largest perception radius

  // Colors
  colors: {
    background: '#0a0a0f',
    human: '#4ecdc4',
    humanGlow: 'rgba(78, 205, 196, 0.15)',
    infected: '#ff6b35',
    infectedAlt: '#ff2e2e',
    zombie: '#8b0000',
    zombieTrail: 'rgba(139, 0, 0, 0.25)',
    dead: '#333333',
    patientZeroRing: '#ffffff',
    uiBackground: 'rgba(10, 10, 15, 0.85)',
    uiText: '#c8c8d0',
    uiAccent: '#ff2e2e',
  },
} as const;
