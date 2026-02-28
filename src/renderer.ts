import type { AgentState, Obstacle } from './types.ts';
import { AgentType, ZombieVariant } from './types.ts';
import { CONFIG } from './config.ts';
import { agentRadius } from './agent.ts';
import type { SimStats, PopSample } from './simulation.ts';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private currentNight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  clear(): void {
    const { ctx, canvas } = this;
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.7,
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawObstacles(obstacles: Obstacle[], nightFactor: number): void {
    const { ctx } = this;
    // Interpolate obstacle colors between day and night
    const r = Math.round(26 - nightFactor * 10);
    const g = Math.round(26 - nightFactor * 10);
    const b = Math.round(46 + nightFactor * 20);
    const br = Math.round(42 - nightFactor * 12);
    const bg = Math.round(42 - nightFactor * 12);
    const bb = Math.round(62 + nightFactor * 30);

    for (const obs of obstacles) {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.strokeStyle = `rgb(${br}, ${bg}, ${bb})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 3);
      ctx.fill();
      ctx.stroke();
    }
  }

  drawAgents(agents: AgentState[], frame: number, nightFactor: number): void {
    this.currentNight = nightFactor;
    for (const agent of agents) {
      switch (agent.type) {
        case AgentType.Human: this.drawHuman(agent); break;
        case AgentType.Infected: this.drawInfected(agent, frame); break;
        case AgentType.Zombie: this.drawZombie(agent, frame); break;
        case AgentType.Dead: this.drawDead(agent); break;
      }
    }
  }

  private drawHuman(agent: AgentState): void {
    const { ctx, currentNight } = this;
    const { pos } = agent;
    const r = CONFIG.agentRadius;

    // Glow shrinks and dims at night (humans hide)
    const glowAlpha = 0.15 - currentNight * 0.08;
    const glowSize = r * (3 - currentNight * 1.2);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(78, 205, 196, ${glowAlpha})`;
    ctx.fill();

    // Body dims slightly at night
    const bright = Math.round(205 - currentNight * 50);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(78, ${bright}, ${bright - 10})`;
    ctx.fill();
  }

  private drawInfected(agent: AgentState, frame: number): void {
    const { ctx } = this;
    const { pos } = agent;
    const r = CONFIG.agentRadius;

    const pulse = (Math.sin(frame * 0.15) + 1) / 2;
    const pulseRadius = r + pulse * 2;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 107, 53, ${0.1 + pulse * 0.1})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
    const green = Math.round(107 - pulse * 61);
    const blue = Math.round(53 - pulse * 7);
    ctx.fillStyle = `rgb(255, ${green}, ${blue})`;
    ctx.fill();
  }

  private drawZombie(agent: AgentState, frame: number): void {
    const { ctx } = this;
    const { pos, trail } = agent;
    const r = agentRadius(agent);

    // Trail
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = (i / trail.length) * 0.3;
      const trailR = r * (i / trail.length) * 0.7;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
      ctx.fill();
    }

    // Color by variant
    let color: string;
    switch (agent.variant) {
      case ZombieVariant.Runner: color = CONFIG.colors.runner; break;
      case ZombieVariant.Tank: color = CONFIG.colors.tank; break;
      default: color = CONFIG.colors.zombie; break;
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Runner: jittery outline
    if (agent.variant === ZombieVariant.Runner) {
      const jitter = Math.sin(frame * 0.5) * 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 2 + jitter, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(204, 51, 0, 0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Tank: thick ring
    if (agent.variant === ZombieVariant.Tank) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(74, 0, 32, 0.7)`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Patient zero ring
    if (agent.isPatientZero) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = CONFIG.colors.patientZeroRing;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  private drawDead(agent: AgentState): void {
    const { ctx } = this;
    const r = CONFIG.agentRadius * 0.7;
    ctx.beginPath();
    ctx.arc(agent.pos.x, agent.pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.dead;
    ctx.fill();
  }

  drawNightOverlay(nightFactor: number): void {
    if (nightFactor < 0.01) return;
    const { ctx, canvas } = this;
    // Deep blue overlay — strong enough to clearly distinguish night
    ctx.fillStyle = `rgba(0, 0, 30, ${nightFactor * 0.55})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle blue vignette intensifies at night edges
    if (nightFactor > 0.3) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.15,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.6,
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, `rgba(0, 0, 40, ${(nightFactor - 0.3) * 0.4})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  drawHeatmap(agents: AgentState[]): void {
    const { ctx, canvas } = this;
    const cellSize = CONFIG.heatmapCellSize;
    const cols = Math.ceil(canvas.width / cellSize);
    const rows = Math.ceil(canvas.height / cellSize);

    // Count zombies per cell
    const grid = new Uint16Array(cols * rows);
    let maxCount = 0;

    for (const agent of agents) {
      if (agent.type !== AgentType.Zombie) continue;
      const col = Math.floor(agent.pos.x / cellSize);
      const row = Math.floor(agent.pos.y / cellSize);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const idx = row * cols + col;
        grid[idx]++;
        if (grid[idx] > maxCount) maxCount = grid[idx];
      }
    }

    if (maxCount === 0) return;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const count = grid[row * cols + col];
        if (count === 0) continue;
        const intensity = count / maxCount;
        const alpha = intensity * CONFIG.heatmapMaxAlpha;
        // Red to yellow gradient
        const g = Math.round(intensity * 80);
        ctx.fillStyle = `rgba(200, ${g}, 0, ${alpha})`;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  drawStats(stats: SimStats, nightFactor: number): void {
    const { ctx } = this;
    const total = stats.humans + stats.infected + stats.zombies;
    const zombieRatio = total > 0 ? (stats.zombies + stats.infected) / total : 0;

    let status: string;
    let statusColor: string;
    if (stats.humans === 0) {
      status = 'EXTINCTION';
      statusColor = '#ff0000';
    } else if (zombieRatio > 0.6) {
      status = 'APOCALYPSE';
      statusColor = '#ff2e2e';
    } else if (zombieRatio > 0.3) {
      status = 'CRITICAL';
      statusColor = '#ff6b35';
    } else if (zombieRatio > 0.05) {
      status = 'SPREADING';
      statusColor = '#ffaa00';
    } else {
      status = 'CONTAINED';
      statusColor = '#4ecdc4';
    }

    const seconds = Math.floor(stats.elapsed / 60);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

    // Day/night indicator
    const timeOfDay = nightFactor > 0.5 ? 'NIGHT' : 'DAY';
    const todColor = nightFactor > 0.5 ? '#4466aa' : '#aa8833';

    const x = 20;
    let y = 30;
    const lineHeight = 22;

    // Panel background shifts blue at night
    const panelR = Math.round(10 - nightFactor * 5);
    const panelG = Math.round(10 - nightFactor * 5);
    const panelB = Math.round(15 + nightFactor * 20);
    ctx.fillStyle = `rgba(${panelR}, ${panelG}, ${panelB}, 0.85)`;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 20, 210, 195, 8);
    ctx.fill();

    // Thin accent border that shifts with day/night
    const borderAlpha = 0.08 + nightFactor * 0.12;
    const borderB2 = Math.round(100 + nightFactor * 155);
    ctx.strokeStyle = `rgba(80, 80, ${borderB2}, ${borderAlpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 14px "JetBrains Mono", monospace';

    ctx.fillStyle = statusColor;
    ctx.fillText(status, x, y);

    // Day/night badge with icon
    ctx.fillStyle = todColor;
    ctx.font = '600 11px "JetBrains Mono", monospace';
    const todIcon = nightFactor > 0.5 ? '\u263D' : '\u2600'; // moon / sun
    ctx.fillText(`${todIcon} ${timeOfDay}`, x + 130, y);

    y += lineHeight;
    // Text color dims slightly at night
    const textBright = Math.round(200 - nightFactor * 40);
    const textBlue = Math.round(208 + nightFactor * 30);
    ctx.font = '400 13px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgb(${textBright}, ${textBright}, ${textBlue})`;
    ctx.fillText(`Time: ${timeStr}`, x, y);
    y += lineHeight + 4;

    ctx.fillStyle = CONFIG.colors.human;
    ctx.fillText(`Humans:   ${stats.humans}`, x, y);
    y += lineHeight;

    ctx.fillStyle = CONFIG.colors.infected;
    ctx.fillText(`Infected: ${stats.infected}`, x, y);
    y += lineHeight;

    ctx.fillStyle = '#cc0000';
    ctx.fillText(`Zombies:  ${stats.zombies}`, x, y);
    y += lineHeight;

    ctx.fillStyle = CONFIG.colors.dead;
    ctx.fillText(`Dead:     ${stats.dead}`, x, y);
  }

  drawSparkline(history: PopSample[], nightFactor: number): void {
    if (history.length < 2) return;

    const { ctx } = this;
    const x = 10;
    const y = this.canvas.height - 100;
    const w = 200;
    const h = 60;

    // Background shifts blue at night
    const panelR = Math.round(10 - nightFactor * 5);
    const panelG = Math.round(10 - nightFactor * 5);
    const panelB = Math.round(15 + nightFactor * 20);
    ctx.fillStyle = `rgba(${panelR}, ${panelG}, ${panelB}, 0.85)`;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    const borderB = Math.round(100 + nightFactor * 155);
    ctx.strokeStyle = `rgba(80, 80, ${borderB}, ${0.08 + nightFactor * 0.12})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const maxPop = Math.max(
      ...history.map(s => s.humans + s.infected + s.zombies),
      1,
    );

    const padX = 6;
    const padY = 6;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    const drawLine = (getValue: (s: PopSample) => number, color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < history.length; i++) {
        const px = x + padX + (i / (history.length - 1)) * plotW;
        const py = y + padY + plotH - (getValue(history[i]) / maxPop) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    drawLine(s => s.humans, CONFIG.colors.human);
    drawLine(s => s.zombies, '#cc0000');
    drawLine(s => s.infected, CONFIG.colors.infected);
  }
}
