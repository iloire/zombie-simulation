import './style.css';
import { Simulation } from './simulation.ts';
import { Renderer } from './renderer.ts';

// --- Canvas setup ---
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

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
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedValue = document.getElementById('speed-value') as HTMLSpanElement;

let paused = false;
let speed = 1;

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

// Click to place zombie
canvas.addEventListener('click', (e) => {
  sim.addZombie(e.clientX, e.clientY);
});

// --- Game loop ---
function loop(): void {
  requestAnimationFrame(loop);

  if (paused) return;

  const ticksThisFrame = Math.round(speed);
  for (let i = 0; i < ticksThisFrame; i++) {
    sim.tick();
  }

  renderer.clear();
  renderer.drawAgents(sim.agents, sim.frame);
  renderer.drawStats(sim.getStats());
}

requestAnimationFrame(loop);
