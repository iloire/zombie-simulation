import type { AgentState } from './types.ts';
import { AgentType } from './types.ts';
import { CONFIG } from './config.ts';
import type { SimStats } from './simulation.ts';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

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

    // Radial vignette
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.7,
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawAgents(agents: AgentState[], frame: number): void {
    for (const agent of agents) {
      switch (agent.type) {
        case AgentType.Human: this.drawHuman(agent); break;
        case AgentType.Infected: this.drawInfected(agent, frame); break;
        case AgentType.Zombie: this.drawZombie(agent); break;
        case AgentType.Dead: this.drawDead(agent); break;
      }
    }
  }

  private drawHuman(agent: AgentState): void {
    const { ctx } = this;
    const { pos } = agent;
    const r = CONFIG.agentRadius;

    // Glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.humanGlow;
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.human;
    ctx.fill();
  }

  private drawInfected(agent: AgentState, frame: number): void {
    const { ctx } = this;
    const { pos } = agent;
    const r = CONFIG.agentRadius;

    // Pulsate between orange and red
    const pulse = (Math.sin(frame * 0.15) + 1) / 2;
    const pulseRadius = r + pulse * 2;

    // Glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 107, 53, ${0.1 + pulse * 0.1})`;
    ctx.fill();

    // Body — interpolate orange to red
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
    const red = Math.round(255);
    const green = Math.round(107 - pulse * 61);
    const blue = Math.round(53 - pulse * 7);
    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    ctx.fill();
  }

  private drawZombie(agent: AgentState): void {
    const { ctx } = this;
    const { pos, trail } = agent;
    const r = CONFIG.agentRadius;

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

    // Body
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.colors.zombie;
    ctx.fill();

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

  drawStats(stats: SimStats): void {
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

    const x = 20;
    let y = 30;
    const lineHeight = 22;

    // Background panel
    ctx.fillStyle = CONFIG.colors.uiBackground;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 20, 200, 165, 8);
    ctx.fill();

    ctx.font = '700 14px "JetBrains Mono", monospace';

    // Status
    ctx.fillStyle = statusColor;
    ctx.fillText(status, x, y);
    y += lineHeight;

    ctx.font = '400 13px "JetBrains Mono", monospace';
    ctx.fillStyle = CONFIG.colors.uiText;
    ctx.fillText(`Time: ${timeStr}`, x, y);
    y += lineHeight + 4;

    // Population counts
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
}
