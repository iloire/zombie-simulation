import './style.css';
import { Simulation } from './simulation.ts';
import { Renderer } from './renderer.ts';
import { SoundEngine } from './sound.ts';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const sound = new SoundEngine();

function resize(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  sim.resize(canvas.width, canvas.height);
}

let sim = new Simulation(window.innerWidth, window.innerHeight);
resize();
window.addEventListener('resize', resize);

// --- UI Controls ---
const btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;
const btnHeatmap = document.getElementById('btn-heatmap') as HTMLButtonElement;
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedValue = document.getElementById('speed-value') as HTMLSpanElement;

let paused = false;
let speed = 1;
let showHeatmap = false;

btnPause.addEventListener('click', () => {
  paused = !paused;
  btnPause.textContent = paused ? 'Play' : 'Pause';
});

btnRestart.addEventListener('click', () => {
  sim = new Simulation(canvas.width, canvas.height);
  paused = false;
  btnPause.textContent = 'Pause';
});

speedSlider.addEventListener('input', () => {
  speed = parseFloat(speedSlider.value);
  speedValue.textContent = `${speed}x`;
});

btnHeatmap.addEventListener('click', () => {
  showHeatmap = !showHeatmap;
  btnHeatmap.textContent = showHeatmap ? 'Heatmap ON' : 'Heatmap';
});

// Keyboard shortcut for heatmap
window.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    showHeatmap = !showHeatmap;
    btnHeatmap.textContent = showHeatmap ? 'Heatmap ON' : 'Heatmap';
  }
  if (e.key === ' ') {
    e.preventDefault();
    paused = !paused;
    btnPause.textContent = paused ? 'Play' : 'Pause';
  }
});

// Click to place zombie (init sound on first interaction)
canvas.addEventListener('click', (e) => {
  sound.init();
  sim.addZombie(e.clientX, e.clientY);
});

// Init sound on any interaction
window.addEventListener('keydown', () => sound.init(), { once: true });

// --- Game loop ---
function loop(): void {
  requestAnimationFrame(loop);

  if (paused) return;

  const ticksThisFrame = Math.round(speed);
  for (let i = 0; i < ticksThisFrame; i++) {
    sim.tick();
  }

  // Sound: infection stabs + night ambient
  if (sim.lastInfections > 0) {
    sound.playInfection();
  }
  sound.updateNight(sim.nightFactor);

  // Render
  const night = sim.nightFactor;
  renderer.clear(night);
  renderer.drawObstacles(sim.obstacles, night);
  renderer.drawAgents(sim.agents, sim.frame, night);
  if (showHeatmap) {
    renderer.drawHeatmap(sim.agents);
  }
  renderer.drawNightOverlay(night);
  const stats = sim.getStats();
  renderer.drawStats(stats, night);
  renderer.drawSparkline(sim.history, night);

  // Update CSS controls theme with night factor
  document.documentElement.style.setProperty('--night', String(night));
}

requestAnimationFrame(loop);
