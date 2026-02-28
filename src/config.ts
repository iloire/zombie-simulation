export const CONFIG = {
  // Population
  initialHumans: 300,
  initialZombies: 1,

  // Agent sizes
  agentRadius: 4,

  // Speeds (px/frame)
  humanSpeed: 2.2,
  infectedSpeed: 1.2,
  zombieSpeed: 1.9,
  runnerSpeed: 3.4,
  tankSpeed: 0.9,

  // Zombie variants
  runnerHp: 1,
  shamblerHp: 2,
  tankHp: 6,
  tankRadius: 7,
  runnerLifespan: 600, // ~10s at 60fps before runner dies

  // Perception radii (px)
  humanFleeRadius: 80,
  zombieSeekRadius: 200,
  cohesionRadius: 60,
  separationRadius: 16,

  // Infection
  biteRange: 14,
  incubationFrames: { min: 300, max: 900 },

  // Variant spawn weights (when infected turns)
  variantWeights: { shambler: 0.6, runner: 0.25, tank: 0.15 },

  // Steering weights
  fleeWeight: 2.2,
  seekWeight: 2.0,
  separationWeight: 2.5,
  cohesionWeight: 0.3,
  wanderWeight: 0.8,
  zombieCohesionWeight: 0.15,
  obstacleAvoidWeight: 5.0,

  // Wander
  wanderJitter: 0.3,

  // Trails
  trailLength: 8,

  // Spatial grid
  cellSize: 200,

  // Day/night cycle
  dayNightCycleDuration: 3600, // frames per full cycle (~60s)
  nightSpeedMultiplier: 1.4,

  // Sparkline
  sparklineMaxSamples: 200,
  sparklineSampleInterval: 15,

  // Heatmap
  heatmapCellSize: 20,
  heatmapMaxAlpha: 0.6,

  // Colors
  colors: {
    background: '#0a0a0f',
    human: '#4ecdc4',
    humanGlow: 'rgba(78, 205, 196, 0.15)',
    infected: '#ff6b35',
    infectedAlt: '#ff2e2e',
    zombie: '#8b0000',
    runner: '#cc3300',
    tank: '#4a0020',
    zombieTrail: 'rgba(139, 0, 0, 0.25)',
    dead: '#333333',
    patientZeroRing: '#ffffff',
    uiBackground: 'rgba(10, 10, 15, 0.85)',
    uiText: '#c8c8d0',
    uiAccent: '#ff2e2e',
    obstacle: '#1a1a2e',
    obstacleBorder: '#2a2a3e',
    nightOverlay: 'rgba(0, 0, 20, 0.35)',
  },
} as const;
