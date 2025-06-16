// Basic scaffold: we will iterate and refine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let hiScore = 0;
let lives = 3;

document.getElementById('score').textContent = score;
document.getElementById('hiscore').textContent = hiScore;
document.getElementById('lives').textContent = lives;

class Player {
  constructor() {
    this.width = 50;
    this.height = 20;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - 60;
    this.speed = 5;
    this.cooldown = false;
  }
  draw() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  move(dir) {
    this.x += dir * this.speed;
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
  }
  fire() {
    if (!this.cooldown && playerProjectiles.length === 0) {
      playerProjectiles.push(new Projectile(this.x + this.width / 2 - 2, this.y - 10, -7, 'player'));
      this.cooldown = true;
      setTimeout(() => (this.cooldown = false), 250);
    }
  }
}

class Projectile {
  constructor(x, y, speed, owner) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.owner = owner;
    this.width = 4;
    this.height = 14;
    this.alive = true;
  }
  update() {
    this.y += this.speed;
    if (this.y < -20 || this.y > canvas.height + 20) this.alive = false;
  }
  draw() {
    ctx.fillStyle = this.owner === 'player' ? '#fff' : '#ff0';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// ------------- Invader, UFO, Bunker classes -------------
class Invader {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 0 squid, 1 crab, 2 octopus
    this.width = 30;
    this.height = 22;
    this.alive = true;
  }
  draw() {
    ctx.fillStyle = ['#fff', '#0ff', '#f0f'][this.type];
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class UFO {
  constructor() {
    this.width = 60;
    this.height = 26;
    this.reset();
  }
  reset() {
    this.visible = false;
    this.x = -100;
    this.y = 60;
    this.speed = 2;
  }
  spawn() {
    this.visible = true;
    this.x = Math.random() < 0.5 ? -this.width : canvas.width + this.width;
    this.speed = (this.x < 0 ? 1 : -1) * (3 + Math.random() * 2);
    playSound('ufo');
  }
  update() {
    if (!this.visible) return;
    this.x += this.speed;
    if (this.x < -this.width - 20 || this.x > canvas.width + 20) this.visible = false;
  }
  draw() {
    if (!this.visible) return;
    ctx.fillStyle = '#f00';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Bunker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gridW = 7;
    this.gridH = 4;
    this.hp = Array.from({ length: this.gridW * this.gridH }, () => 2);
  }
  hit(px, py) {
    const col = Math.floor((px - this.x) / 10);
    const row = Math.floor((py - this.y) / 10);
    if (col < 0 || col >= this.gridW || row < 0 || row >= this.gridH) return false;
    const idx = row * this.gridW + col;
    if (this.hp[idx] > 0) {
      this.hp[idx]--;
      return true;
    }
    return false;
  }
  draw() {
    for (let r = 0; r < this.gridH; r++) {
      for (let c = 0; c < this.gridW; c++) {
        const idx = r * this.gridW + c;
        if (this.hp[idx] === 0) continue;
        ctx.fillStyle = this.hp[idx] === 2 ? '#0f0' : '#ff0';
        ctx.fillRect(this.x + c * 10, this.y + r * 10, 10, 10);
      }
    }
  }
}

// ------------- Game State -------------
let player = new Player();
let invaders = [];
let ufo = new UFO();
let bunkers = [];
let playerProjectiles = [];
let invaderProjectiles = [];
let gameOver = false;

let left = false,
  right = false,
  space = false;

let invaderDir = 1;
let invaderMoveTick = 0;
let invaderMoveInterval = 40;

function resetGame() {
  score = 0;
  lives = 3;
  invaders = [];
  bunkers = [];
  playerProjectiles = [];
  invaderProjectiles = [];
  ufo.reset();
  gameOver = false;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 11; col++) {
      const type = row === 0 ? 0 : row < 3 ? 1 : 2;
      invaders.push(new Invader(60 + col * 40, 100 + row * 32, type));
    }
  }
  for (let i = 0; i < 4; i++) bunkers.push(new Bunker(60 + i * 130, canvas.height - 160));
}

// ------------- Input listeners -------------
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') left = true;
  if (e.code === 'ArrowRight') right = true;
  if (e.code === 'Space') space = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft') left = false;
  if (e.code === 'ArrowRight') right = false;
  if (e.code === 'Space') space = false;
});

// ------------- Utility -------------
function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// ------------- Simple Web Audio Beeps -------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration = 0.1) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  o.connect(g);
  g.connect(audioCtx.destination);
  g.gain.value = 0.05;
  o.start();
  o.stop(audioCtx.currentTime + duration);
}
function playSound(type) {
  const table = {
    shoot: 880,
    invaderDie: 220,
    playerDie: 110,
    ufo: 660,
    ufoHit: 1320,
    move: 440,
  };
  if (table[type]) playBeep(table[type], 0.1);
}

// ------------- Game Loop -------------
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player controls
  if (left) player.move(-1);
  if (right) player.move(1);
  player.draw();
  if (space) player.fire();

  // Projectiles update/draw
  playerProjectiles.forEach((p) => {
    p.update();
    p.draw();
  });
  playerProjectiles = playerProjectiles.filter((p) => p.alive);

  invaderProjectiles.forEach((p) => {
    p.update();
    p.draw();
  });
  invaderProjectiles = invaderProjectiles.filter((p) => p.alive);

  // Invader movement
  const aliveInv = invaders.filter((i) => i.alive);
  let leftMost = canvas.width,
    rightMost = 0,
    bottomMost = 0;
  aliveInv.forEach((inv) => {
    leftMost = Math.min(leftMost, inv.x);
    rightMost = Math.max(rightMost, inv.x + inv.width);
    bottomMost = Math.max(bottomMost, inv.y + inv.height);
  });
  if (++invaderMoveTick >= invaderMoveInterval) {
    invaderMoveTick = 0;
    const dx = invaderDir * 14;
    let drop = false;
    if (leftMost + dx < 0 || rightMost + dx > canvas.width) {
      invaderDir *= -1;
      drop = true;
    }
    aliveInv.forEach((inv) => {
      if (drop) inv.y += 18;
      else inv.x += dx;
    });
    invaderMoveInterval = Math.max(6, 40 - 35 * (1 - aliveInv.length / 55));
    playSound('move');
  }
  aliveInv.forEach((inv) => inv.draw());

  // Invader firing
  if (Math.random() < 0.03 && aliveInv.length) {
    const columns = {};
    aliveInv.forEach((inv) => {
      columns[inv.x] = inv;
    });
    const shooters = Object.values(columns);
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    invaderProjectiles.push(new Projectile(shooter.x + shooter.width / 2, shooter.y + shooter.height, 4, 'invader'));
    playSound('shoot');
  }

  // UFO update/draw
  if (!ufo.visible && Math.random() < 0.001) ufo.spawn();
  ufo.update();
  ufo.draw();

  // Bunkers draw
  bunkers.forEach((b) => b.draw());

  // Collisions
  playerProjectiles.forEach((p) => {
    aliveInv.forEach((inv) => {
      if (inv.alive && rectsOverlap(p, inv)) {
        inv.alive = false;
        p.alive = false;
        score += [30, 20, 10][inv.type];
        playSound('invaderDie');
      }
    });
    if (ufo.visible && rectsOverlap(p, ufo)) {
      ufo.visible = false;
      p.alive = false;
      score += 100 + Math.floor(Math.random() * 150);
      playSound('ufoHit');
    }
    bunkers.forEach((b) => {
      if (b.hit(p.x, p.y)) p.alive = false;
    });
  });

  invaderProjectiles.forEach((p) => {
    if (rectsOverlap(p, player)) {
      p.alive = false;
      lives--;
      playSound('playerDie');
      if (lives <= 0) gameOver = true;
    }
    bunkers.forEach((b) => {
      if (b.hit(p.x, p.y)) p.alive = false;
    });
  });

  if (bottomMost >= player.y) gameOver = true;

  // UI
  document.getElementById('score').textContent = score;
  document.getElementById('hiscore').textContent = hiScore;
  document.getElementById('lives').textContent = lives;

  // Game over
  if (gameOver) {
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText('GAME OVER', 140, 350);
    hiScore = Math.max(hiScore, score);
    setTimeout(resetGame, 2000);
    return;
  }
  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);

