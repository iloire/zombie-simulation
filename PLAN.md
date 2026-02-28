# Zombie Simulation — Implementation Plan

A 2D agent-based zombie outbreak simulation rendered on HTML Canvas. Agents move continuously in a bounded world. The simulation demonstrates emergent tipping-point dynamics: slow initial spread → exponential explosion → pockets of survivors overwhelmed.

## Tech Stack

- **Vanilla TypeScript** + HTML Canvas (no frameworks, no libraries)
- Vite for dev server / bundling
- Single `index.html` entry point

## Agent Types

### Human (blue-green)
- Wanders randomly by default
- **Flees** nearest zombie within perception radius (~120 px)
- **Groups** loosely with nearby humans (weak cohesion force)
- Has a `speed` stat (faster than shamblers, slower than runners)

### Infected (orange, pulsing)
- Was human, bitten by zombie
- Moves erratically at reduced speed
- **Incubation timer**: 5–15 seconds → turns into Zombie
- Other humans flee infected too (they can tell something's wrong)

### Zombie (dark red/gray)
- **Seeks** nearest human within detection radius (~200 px)
- Wanders randomly when no target
- **Bite range**: ~10 px — on contact, human → infected
- Slight cohesion with nearby zombies → emergent horde formation
- Slower than humans (shamblers only for v1)

### Dead (dark gray, static, fades out)
- Zombies that are killed (v2 — combat) or starve (optional)
- Fade out over a few seconds, then removed from simulation

## World

- Canvas fills viewport
- Bounded — agents bounce/steer away from edges
- Dark background (near-black) with subtle grid or noise texture
- Initial population: ~300 humans, 1 "Patient Zero" zombie (highlighted differently)

## Core Simulation Loop

```
each frame:
  for each agent:
    1. perceive(nearby agents within radius)
    2. compute steering forces (flee / seek / wander / cohesion)
    3. update velocity (clamp to max speed)
    4. update position (respect bounds)
    5. check interactions (bite range → infect)
    6. update timers (incubation countdown)
  render all agents
  update stats overlay
```

## Steering Behaviors

Each agent accumulates **force vectors** per frame, then the sum is applied to velocity:

| Behavior    | Used by       | Description                                      |
|-------------|---------------|--------------------------------------------------|
| **Wander**  | All           | Small random steering angle change each frame     |
| **Seek**    | Zombie        | Steer toward nearest human                        |
| **Flee**    | Human         | Steer away from nearest zombie/infected           |
| **Cohesion**| Human, Zombie | Weak pull toward centroid of nearby same-type     |
| **Separation** | All        | Push away from very close agents (avoid overlap)  |

Forces are weighted and summed. Priority: Flee > Separation > Seek > Cohesion > Wander.

## Spatial Partitioning

Naive O(n²) neighbor checks won't scale past ~500 agents. Use a **uniform grid** (cell size = largest perception radius):

- Divide world into grid cells
- Each frame, bucket agents into cells
- Neighbor queries only check the 9 surrounding cells
- Simple to implement, good enough for ~2000 agents

## Visual Design

- **Background**: #0a0a0f with faint radial vignette
- **Humans**: solid circles (#4ecdc4), slight glow
- **Infected**: pulsating between #ff6b35 and #ff2e2e (use sine wave on alpha/radius)
- **Zombies**: #8b0000 with slight dark trail (store last 3–5 positions, draw with decreasing opacity)
- **Patient Zero**: distinct marker (white ring around it)
- Movement trails: short fading lines behind agents showing panic paths
- Canvas filter: slight bloom/glow effect on agents against dark background

## UI Overlay

Top-left stats panel (semi-transparent):
- Population counts: Humans / Infected / Zombies / Dead
- Time elapsed
- Outbreak status: "Contained" / "Spreading" / "Critical" / "Apocalypse"

Bottom controls:
- **Speed slider** (0.5x — 3x)
- **Pause / Play** button
- **Restart** button
- Click canvas to place new zombie (interactive seeding)

## Architecture

```
src/
  main.ts           — entry point, canvas setup, game loop
  simulation.ts     — Simulation class (tick, add/remove agents)
  agent.ts          — agent creation, per-frame update, infection check
  steering.ts       — steering behavior functions (seek, flee, wander, cohesion, separation)
  spatial-grid.ts   — SpatialGrid class for neighbor lookups
  renderer.ts       — all canvas drawing (agents, trails, UI overlay)
  vec2.ts           — vector math utilities (add, sub, normalize, limit, dist)
  sound.ts          — Web Audio ambient drone + infection stab SFX
  config.ts         — tunable constants (speeds, radii, population, colors)
  types.ts          — shared type definitions (AgentType, ZombieVariant, Vec2, AgentState, Obstacle)
```

## Implementation Phases

### Phase 1 — Core simulation ✅
- [x] Project setup: Vite + TypeScript, canvas filling viewport
- [x] Agent class with position, velocity, type
- [x] Basic wander steering
- [x] Render loop: draw colored circles on dark canvas
- [x] Spatial grid for neighbor queries

### Phase 2 — Infection mechanics ✅
- [x] Zombie seek behavior (chase nearest human)
- [x] Human flee behavior (run from nearest zombie)
- [x] Bite detection → human becomes infected
- [x] Incubation timer → infected becomes zombie
- [x] Patient Zero with distinct visual (white ring)

### Phase 3 — Emergent behavior polish ✅
- [x] Cohesion + separation forces
- [x] Zombie horde formation (weak mutual attraction)
- [x] Human grouping behavior
- [x] Movement trails (fading position history)
- [x] Agent pulsing/glow effects (infected pulsates orange→red)

### Phase 4 — UI and interactivity ✅
- [x] Stats overlay (population counters, outbreak status)
- [x] Speed control slider (0.25x–3x)
- [x] Pause/play/restart controls
- [x] Click-to-place zombie
- [x] Population graph over time (small sparkline)

### Phase 5 — Advanced features ✅
- [x] Zombie types: runners (fast, fragile, short-lived), tanks (slow, large, thick ring)
- [x] Day/night cycle (blue overlay, zombies faster at night, ambient drone deepens)
- [x] Simple obstacles/buildings (random rectangles with collision + steering avoidance)
- [x] Sound: ambient sawtooth drone + dissonant stab on infection events
- [x] Heatmap overlay toggle (H key or button, zombie density heat grid)
