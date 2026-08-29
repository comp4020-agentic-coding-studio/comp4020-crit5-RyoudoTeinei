import { experienceNeeded, resolveEnemyContact } from "./src/game-rules";

type RunState = "menu" | "playing" | "levelup" | "won" | "lost";
type EnemyKind = "bud" | "dart" | "brute" | "boss";

interface Point { x: number; y: number }
interface Player extends Point {
  radius: number; health: number; maxHealth: number; speed: number; lastHitAt: number;
  fireDelay: number; fireTimer: number; projectileCount: number; projectileDamage: number;
  projectileSpeed: number; pickupRadius: number; level: number; xp: number;
}
interface Enemy extends Point {
  id: number; kind: EnemyKind; radius: number; speed: number; health: number;
  maxHealth: number; angle: number; hitFlash: number;
}
interface Projectile extends Point { vx: number; vy: number; radius: number; damage: number; life: number }
interface Gem extends Point { value: number; vx: number; vy: number; age: number }
interface Particle extends Point { vx: number; vy: number; life: number; maxLife: number; colour: string; size: number }
interface Upgrade { id: string; icon: string; name: string; detail: string; apply: () => void }

const must = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const canvas = must<HTMLCanvasElement>("#game");
const drawingContext = canvas.getContext("2d");
if (!drawingContext) throw new Error("Canvas 2D is unavailable");
const context: CanvasRenderingContext2D = drawingContext;

const startButton = must<HTMLButtonElement>("#start-button");
const replayButton = must<HTMLButtonElement>("#replay-button");
const soundButton = must<HTMLButtonElement>("#sound-toggle");
const startScreen = must<HTMLElement>("#start-screen");
const levelScreen = must<HTMLElement>("#level-screen");
const resultScreen = must<HTMLElement>("#result-screen");
const upgradeGrid = must<HTMLElement>("#upgrade-grid");
const hud = must<HTMLElement>("#hud");
const timerText = must<HTMLElement>("#timer");
const healthElement = must<HTMLElement>("#health");
const levelText = must<HTMLElement>("#level");
const xpFill = must<HTMLElement>("#xp-fill");
const bossBanner = must<HTMLElement>("#boss-banner");
const bossFill = must<HTMLElement>("#boss-fill");
const resultKicker = must<HTMLElement>("#result-kicker");
const resultTitle = must<HTMLElement>("#result-title");
const resultTime = must<HTMLElement>("#result-time");
const resultKills = must<HTMLElement>("#result-kills");
const resultLevel = must<HTMLElement>("#result-level");

const ROUND_SECONDS = 180;
const BOSS_AT_SECONDS = 145;
const colours = {
  ink: "#14213d", paper: "#f7f2e8", blue: "#39bff0", coral: "#ff5f56",
  lime: "#d8f04e", violet: "#7458e8", yellow: "#ffd166",
};

let width = 0;
let height = 0;
let state: RunState = "menu";
let elapsed = 0;
let kills = 0;
let spawnTimer = 0;
let enemySequence = 0;
let bossSpawned = false;
let shake = 0;
let lastFrame = performance.now();
let muted = false;
let audioContext: AudioContext | null = null;
let pointerTarget: Point = { x: 0, y: 0 };
let pointerActive = false;
const keys = new Set<string>();
let enemies: Enemy[] = [];
let projectiles: Projectile[] = [];
let gems: Gem[] = [];
let particles: Particle[] = [];
let player: Player = freshPlayer();

function freshPlayer(): Player {
  return {
    x: width / 2, y: height / 2, radius: 17, health: 5, maxHealth: 5, speed: 255,
    lastHitAt: -10_000, fireDelay: 0.58, fireTimer: 0, projectileCount: 1,
    projectileDamage: 2, projectileSpeed: 640, pickupRadius: 92, level: 1, xp: 0,
  };
}

function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  player.x = clamp(player.x || width / 2, 28, Math.max(28, width - 28));
  player.y = clamp(player.y || height / 2, 28, Math.max(28, height - 28));
  if (!pointerTarget.x) pointerTarget = { x: player.x, y: player.y };
}

function beginRun(): void {
  state = "playing";
  elapsed = 0;
  kills = 0;
  spawnTimer = 1.15;
  enemySequence = 0;
  bossSpawned = false;
  shake = 0;
  enemies = [];
  projectiles = [];
  gems = [];
  particles = [];
  player = freshPlayer();
  player.x = width / 2;
  player.y = height / 2;
  pointerTarget = { x: player.x, y: player.y };
  pointerActive = false;
  startScreen.hidden = true;
  resultScreen.hidden = true;
  levelScreen.hidden = true;
  bossBanner.hidden = true;
  hud.classList.remove("is-hidden");
  ensureAudio();
  tone(330, 0.11, "sine", 0.04);
  refreshHud();
}

function updateGame(dt: number): void {
  elapsed = Math.min(ROUND_SECONDS, elapsed + dt);
  updatePlayer(dt);
  if (!bossSpawned) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      const pressure = Math.min(0.58, elapsed / 260);
      spawnTimer = Math.max(0.22, 0.84 - pressure) * randomBetween(0.78, 1.16);
    }
  }
  if (elapsed >= BOSS_AT_SECONDS && !bossSpawned) spawnBoss();
  updateWeapon(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateGems(dt);
  updateParticles(dt);
  shake = Math.max(0, shake - dt * 28);
  if (elapsed >= ROUND_SECONDS && state === "playing") endRun(false);
  refreshHud();
}

function updatePlayer(dt: number): void {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;
  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    player.x += (dx / length) * player.speed * dt;
    player.y += (dy / length) * player.speed * dt;
  } else if (pointerActive) {
    const tx = pointerTarget.x - player.x;
    const ty = pointerTarget.y - player.y;
    const distance = Math.hypot(tx, ty);
    if (distance > 3) {
      const amount = Math.min(distance, player.speed * dt);
      player.x += (tx / distance) * amount;
      player.y += (ty / distance) * amount;
    }
  }
  player.x = clamp(player.x, player.radius + 8, width - player.radius - 8);
  player.y = clamp(player.y, player.radius + 8, height - player.radius - 8);
}

function updateWeapon(dt: number): void {
  player.fireTimer -= dt;
  if (player.fireTimer > 0 || enemies.length === 0) return;
  const target = enemies.reduce((closest, enemy) =>
    distanceSquared(player, enemy) < distanceSquared(player, closest) ? enemy : closest,
  );
  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  const spread = 0.14;
  for (let i = 0; i < player.projectileCount; i += 1) {
    const angle = baseAngle + (i - (player.projectileCount - 1) / 2) * spread;
    projectiles.push({
      x: player.x, y: player.y, vx: Math.cos(angle) * player.projectileSpeed,
      vy: Math.sin(angle) * player.projectileSpeed, radius: 5,
      damage: player.projectileDamage, life: 1.35,
    });
  }
  player.fireTimer = player.fireDelay;
  tone(520, 0.035, "triangle", 0.012);
}

function updateProjectiles(dt: number): void {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const shot = projectiles[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    let consumed = shot.life <= 0;
    for (let j = enemies.length - 1; j >= 0 && !consumed; j -= 1) {
      const enemy = enemies[j];
      if (distanceSquared(shot, enemy) <= (shot.radius + enemy.radius) ** 2) {
        enemy.health -= shot.damage;
        enemy.hitFlash = 0.09;
        burst(shot.x, shot.y, enemy.kind === "boss" ? colours.violet : colours.coral, 4, 90);
        consumed = true;
        if (enemy.health <= 0) defeatEnemy(j);
      }
    }
    if (consumed || shot.x < -40 || shot.x > width + 40 || shot.y < -40 || shot.y > height + 40) {
      projectiles.splice(i, 1);
    }
  }
}

function updateEnemies(dt: number): void {
  const now = performance.now();
  for (const enemy of enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.angle += dt * (enemy.kind === "dart" ? 4 : 1.5);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const sway = enemy.kind === "dart" ? Math.sin(elapsed * 5 + enemy.id) * 0.32 : 0;
    enemy.x += ((dx / length) - (dy / length) * sway) * enemy.speed * dt;
    enemy.y += ((dy / length) + (dx / length) * sway) * enemy.speed * dt;
    if (length <= player.radius + enemy.radius) {
      const result = resolveEnemyContact({ health: player.health, lastHitAt: player.lastHitAt }, now);
      if (result.didDamage) {
        player.health = result.health;
        player.lastHitAt = result.lastHitAt;
        shake = 12;
        burst(player.x, player.y, colours.ink, 13, 190);
        tone(92, 0.18, "sawtooth", 0.055);
        enemy.x -= (dx / length) * 32;
        enemy.y -= (dy / length) * 32;
        if (result.ended) { endRun(false); return; }
      }
    }
  }
}

function updateGems(dt: number): void {
  for (let i = gems.length - 1; i >= 0; i -= 1) {
    const gem = gems[i];
    gem.age += dt;
    gem.x += gem.vx * dt;
    gem.y += gem.vy * dt;
    gem.vx *= Math.pow(0.02, dt);
    gem.vy *= Math.pow(0.02, dt);
    const dx = player.x - gem.x;
    const dy = player.y - gem.y;
    const distance = Math.hypot(dx, dy);
    if (distance < player.pickupRadius) {
      const pull = 320 + (player.pickupRadius - distance) * 7;
      gem.x += (dx / Math.max(1, distance)) * pull * dt;
      gem.y += (dy / Math.max(1, distance)) * pull * dt;
    }
    if (distance < player.radius + 9) {
      player.xp += gem.value;
      gems.splice(i, 1);
      tone(760 + player.xp * 7, 0.035, "sine", 0.016);
      if (player.xp >= experienceNeeded(player.level)) openLevelUp();
    }
  }
}

function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.35, dt);
    particle.vy *= Math.pow(0.35, dt);
    particle.life -= dt;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}

function spawnEnemy(): void {
  const roll = Math.random();
  let kind: EnemyKind = "bud";
  if (elapsed > 75 && roll > 0.82) kind = "brute";
  else if (elapsed > 34 && roll > 0.64) kind = "dart";
  const edge = Math.floor(Math.random() * 4);
  const margin = 48;
  const point = edge === 0 ? { x: randomBetween(0, width), y: -margin }
    : edge === 1 ? { x: width + margin, y: randomBetween(0, height) }
      : edge === 2 ? { x: randomBetween(0, width), y: height + margin }
        : { x: -margin, y: randomBetween(0, height) };
  const profile = kind === "dart"
    ? { radius: 11, speed: 100 + elapsed * 0.1, health: 2 }
    : kind === "brute"
      ? { radius: 24, speed: 38 + elapsed * 0.06, health: 10 }
      : { radius: 16, speed: 55 + elapsed * 0.13, health: 3 + Math.floor(elapsed / 100) };
  enemies.push({ ...point, id: enemySequence++, kind, ...profile, maxHealth: profile.health, angle: Math.random() * Math.PI, hitFlash: 0 });
}

function spawnBoss(): void {
  bossSpawned = true;
  bossBanner.hidden = false;
  enemies.push({
    x: width / 2, y: -72, id: enemySequence++, kind: "boss", radius: 54,
    speed: 31, health: 72, maxHealth: 72, angle: 0, hitFlash: 0,
  });
  shake = 8;
  tone(72, 0.5, "sawtooth", 0.045);
}

function defeatEnemy(index: number): void {
  const enemy = enemies[index];
  enemies.splice(index, 1);
  if (enemy.kind === "boss") {
    burst(enemy.x, enemy.y, colours.violet, 44, 310);
    tone(196, 0.3, "triangle", 0.05);
    window.setTimeout(() => state === "playing" && endRun(true), 350);
    return;
  }
  kills += 1;
  const gemCount = enemy.kind === "brute" ? 3 : 1;
  for (let i = 0; i < gemCount; i += 1) {
    const angle = (Math.PI * 2 * i) / gemCount + Math.random() * 0.5;
    gems.push({ x: enemy.x, y: enemy.y, value: 1, vx: Math.cos(angle) * 70, vy: Math.sin(angle) * 70, age: 0 });
  }
  burst(enemy.x, enemy.y, enemy.kind === "dart" ? colours.yellow : colours.coral, 8, 150);
  tone(210, 0.045, "square", 0.012);
}

function openLevelUp(): void {
  if (state !== "playing") return;
  state = "levelup";
  const needed = experienceNeeded(player.level);
  player.xp -= needed;
  player.level += 1;
  refreshHud();
  const choices = [...allUpgrades].sort(() => Math.random() - 0.5).slice(0, 3);
  upgradeGrid.replaceChildren();
  for (const upgrade of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upgrade-card";
    button.innerHTML = `<span class="upgrade-icon" aria-hidden="true">${upgrade.icon}</span><strong>${upgrade.name}</strong><small>${upgrade.detail}</small>`;
    button.addEventListener("click", () => chooseUpgrade(upgrade));
    upgradeGrid.append(button);
  }
  levelScreen.hidden = false;
  tone(440, 0.08, "sine", 0.03);
  window.setTimeout(() => tone(660, 0.12, "sine", 0.03), 70);
  window.setTimeout(() => upgradeGrid.querySelector<HTMLButtonElement>("button")?.focus(), 20);
}

function chooseUpgrade(upgrade: Upgrade): void {
  upgrade.apply();
  levelScreen.hidden = true;
  state = "playing";
  tone(880, 0.12, "triangle", 0.035);
  burst(player.x, player.y, colours.lime, 18, 190);
  canvas.focus();
}

const allUpgrades: Upgrade[] = [
  { id: "split", icon: "✣", name: "Second bloom", detail: "+1 PETAL PER VOLLEY", apply: () => { player.projectileCount = Math.min(5, player.projectileCount + 1); } },
  { id: "quick", icon: "↯", name: "Quick pollen", detail: "18% FASTER VOLLEYS", apply: () => { player.fireDelay = Math.max(0.18, player.fireDelay * 0.82); } },
  { id: "heavy", icon: "●", name: "Heavy petals", detail: "+1 IMPACT", apply: () => { player.projectileDamage += 1; } },
  { id: "swift", icon: "➜", name: "Long stems", detail: "+15% MOVEMENT", apply: () => { player.speed *= 1.15; } },
  { id: "magnet", icon: "◇", name: "Sweet scent", detail: "+50 PICKUP REACH", apply: () => { player.pickupRadius += 50; } },
  { id: "mend", icon: "♥", name: "Fresh leaf", detail: "+1 HEART", apply: () => { player.health = Math.min(player.maxHealth, player.health + 1); } },
];

function endRun(won: boolean): void {
  if (state !== "playing") return;
  state = won ? "won" : "lost";
  bossBanner.hidden = true;
  hud.classList.add("is-hidden");
  resultKicker.textContent = won ? "RUN COMPLETE" : "RUN ENDED";
  resultTitle.textContent = won ? "FULL BLOOM" : "CUT SHORT";
  resultTime.textContent = formatTime(elapsed);
  resultKills.textContent = String(kills).padStart(3, "0");
  resultLevel.textContent = String(player.level).padStart(2, "0");
  resultScreen.hidden = false;
  tone(won ? 392 : 110, won ? 0.55 : 0.35, won ? "sine" : "sawtooth", 0.05);
  window.setTimeout(() => replayButton.focus(), 50);
}

function refreshHud(): void {
  timerText.textContent = formatTime(Math.max(0, ROUND_SECONDS - elapsed));
  levelText.textContent = String(player.level).padStart(2, "0");
  xpFill.style.width = `${Math.min(100, (player.xp / experienceNeeded(player.level)) * 100)}%`;
  healthElement.replaceChildren();
  for (let i = 0; i < player.maxHealth; i += 1) {
    const pip = document.createElement("span");
    pip.className = `health-pip${i >= player.health ? " is-empty" : ""}`;
    healthElement.append(pip);
  }
  healthElement.setAttribute("aria-label", `${player.health} health remaining`);
  const boss = enemies.find((enemy) => enemy.kind === "boss");
  if (boss) bossFill.style.width = `${Math.max(0, boss.health / boss.maxHealth) * 100}%`;
}

function render(timestamp: number): void {
  context.save();
  context.translate(shake ? randomBetween(-shake, shake) : 0, shake ? randomBetween(-shake, shake) : 0);
  drawField(timestamp);
  if (state === "menu") drawMenuGarden(timestamp);
  else {
    for (const gem of gems) drawGem(gem, timestamp);
    for (const projectile of projectiles) drawProjectile(projectile);
    for (const enemy of enemies) drawEnemy(enemy);
    drawPlayer(timestamp);
    for (const particle of particles) drawParticle(particle);
  }
  context.restore();
}

function drawField(timestamp: number): void {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fbf6ec");
  gradient.addColorStop(0.48, "#f1ecff");
  gradient.addColorStop(1, "#e9f7ef");
  context.fillStyle = gradient;
  context.fillRect(-20, -20, width + 40, height + 40);
  const t = timestamp / 1800;
  const fields = [
    { x: width * 0.12 + Math.sin(t) * 18, y: height * 0.78, r: Math.min(width, height) * 0.25, c: "rgba(255,95,86,.10)" },
    { x: width * 0.8, y: height * 0.18 + Math.cos(t * 0.7) * 20, r: Math.min(width, height) * 0.3, c: "rgba(57,191,240,.12)" },
    { x: width * 0.58, y: height * 0.9, r: Math.min(width, height) * 0.24, c: "rgba(216,240,78,.12)" },
  ];
  for (const field of fields) {
    context.beginPath();
    context.arc(field.x, field.y, field.r, 0, Math.PI * 2);
    context.fillStyle = field.c;
    context.fill();
  }
  context.strokeStyle = "rgba(20,33,61,.07)";
  context.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    context.beginPath();
    context.arc(width * 0.5, height * 0.52, 90 + i * Math.min(width, height) * 0.12, -0.3, Math.PI * 1.35);
    context.stroke();
  }
}

function drawMenuGarden(timestamp: number): void {
  const t = timestamp / 1000;
  const items = [
    { x: width * 0.13, y: height * 0.25, r: 25, c: colours.blue, a: t * 0.6 },
    { x: width * 0.83, y: height * 0.7, r: 38, c: colours.coral, a: -t * 0.45 },
    { x: width * 0.77, y: height * 0.22, r: 17, c: colours.violet, a: t * 0.8 },
    { x: width * 0.2, y: height * 0.77, r: 15, c: colours.yellow, a: -t },
  ];
  for (const item of items) drawFlowerShape(item.x, item.y + Math.sin(t + item.x) * 8, item.r, item.c, item.a, 6);
}

function drawPlayer(timestamp: number): void {
  const invulnerable = performance.now() - player.lastHitAt < 900;
  if (invulnerable && Math.floor(timestamp / 70) % 2 === 0) return;
  context.save();
  context.translate(player.x, player.y);
  context.rotate(timestamp / 1300);
  for (let i = 0; i < 6; i += 1) {
    context.rotate(Math.PI / 3);
    context.beginPath();
    context.ellipse(0, -18, 8, 14, 0, 0, Math.PI * 2);
    context.fillStyle = i % 2 ? "#9de8ff" : colours.blue;
    context.fill();
    context.strokeStyle = colours.ink;
    context.lineWidth = 1.5;
    context.stroke();
  }
  context.rotate(-timestamp / 1300 - Math.PI * 2);
  context.beginPath();
  context.arc(0, 0, 11, 0, Math.PI * 2);
  context.fillStyle = colours.lime;
  context.fill();
  context.strokeStyle = colours.ink;
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function drawEnemy(enemy: Enemy): void {
  const colour = enemy.hitFlash > 0 ? "#ffffff"
    : enemy.kind === "dart" ? colours.yellow
      : enemy.kind === "brute" ? colours.violet
        : enemy.kind === "boss" ? colours.ink : colours.coral;
  const petals = enemy.kind === "dart" ? 3 : enemy.kind === "brute" ? 4 : enemy.kind === "boss" ? 10 : 7;
  drawFlowerShape(enemy.x, enemy.y, enemy.radius, colour, enemy.angle, petals);
  if (enemy.kind === "boss") {
    context.beginPath();
    context.arc(enemy.x, enemy.y, enemy.radius + 11, 0, Math.PI * 2);
    context.strokeStyle = colours.coral;
    context.lineWidth = 3;
    context.setLineDash([6, 7]);
    context.stroke();
    context.setLineDash([]);
  }
}

function drawFlowerShape(x: number, y: number, radius: number, colour: string, angle: number, petals: number): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  for (let i = 0; i < petals * 2; i += 1) {
    const a = (i / (petals * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.63;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fillStyle = colour;
  context.fill();
  context.strokeStyle = colours.ink;
  context.lineWidth = Math.max(1.5, radius * 0.08);
  context.stroke();
  context.beginPath();
  context.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  context.fillStyle = colours.paper;
  context.fill();
  context.stroke();
  context.restore();
}

function drawProjectile(projectile: Projectile): void {
  context.save();
  context.translate(projectile.x, projectile.y);
  context.rotate(Math.atan2(projectile.vy, projectile.vx));
  context.beginPath();
  context.ellipse(0, 0, 10, projectile.radius, 0, 0, Math.PI * 2);
  context.fillStyle = colours.blue;
  context.fill();
  context.strokeStyle = colours.ink;
  context.lineWidth = 1.5;
  context.stroke();
  context.restore();
}

function drawGem(gem: Gem, timestamp: number): void {
  const pulse = 1 + Math.sin(timestamp / 130 + gem.age * 4) * 0.13;
  context.save();
  context.translate(gem.x, gem.y);
  context.rotate(timestamp / 900 + gem.age);
  context.scale(pulse, pulse);
  context.fillStyle = colours.lime;
  context.strokeStyle = colours.ink;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(0, -8); context.lineTo(6, 0); context.lineTo(0, 8); context.lineTo(-6, 0); context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawParticle(particle: Particle): void {
  context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
  context.fillStyle = particle.colour;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

function burst(x: number, y: number, colour: string, count: number, speed: number): void {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = randomBetween(speed * 0.35, speed);
    const life = randomBetween(0.25, 0.7);
    particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, maxLife: life, colour, size: randomBetween(2, 5) });
  }
}

function pointFromEvent(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

canvas.addEventListener("pointerdown", (event) => {
  if (state !== "playing") return;
  pointerTarget = pointFromEvent(event);
  pointerActive = true;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (state !== "playing") return;
  if (event.pointerType === "mouse" || pointerActive) {
    pointerTarget = pointFromEvent(event);
    pointerActive = true;
  }
});
canvas.addEventListener("pointerup", (event) => { if (event.pointerType !== "mouse") pointerActive = false; });
window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
    keys.add(event.code);
    event.preventDefault();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", beginRun);
replayButton.addEventListener("click", beginRun);
soundButton.addEventListener("click", () => {
  muted = !muted;
  soundButton.classList.toggle("is-muted", muted);
  soundButton.setAttribute("aria-label", muted ? "Enable sound" : "Mute sound");
  if (!muted) { ensureAudio(); tone(440, 0.08, "sine", 0.025); }
});

function ensureAudio(): void {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
}

function tone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
  if (muted || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function tick(timestamp: number): void {
  const dt = Math.min(0.033, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  if (state === "playing") updateGame(dt);
  render(timestamp);
  requestAnimationFrame(tick);
}

function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
function distanceSquared(a: Point, b: Point): number { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2; }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
function randomBetween(min: number, max: number): number { return min + Math.random() * (max - min); }

resizeCanvas();
refreshHud();
requestAnimationFrame(tick);
