const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let enemies;
let bullets;
let score = 0;
let lives = 3;
let stage = 1;
let scoreText;
let livesText;
let stageText;
let gameOver = false;

function preload() {
    this.load.image('player', 'assets/images/player.png');
    this.load.image('enemy', 'assets/images/enemy.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('ufo', 'assets/images/ufo.png');
    this.load.audio('laser', 'assets/sounds/laser.wav');
    this.load.audio('explosion', 'assets/sounds/explosion.wav');
}

function create() {
    player = this.physics.add.sprite(400, 500, 'player');
    player.setCollideWorldBounds(true);
    
    enemies = this.physics.add.group();
    createEnemies();
    
    bullets = this.physics.add.group();
    
    this.laserSound = this.sound.add('laser');
    this.explosionSound = this.sound.add('explosion');
    
    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
    
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    livesText = this.add.text(16, 64, 'Lives: 3', { fontSize: '32px', fill: '#fff' });
    stageText = this.add.text(600, 16, 'Stage: 1', { fontSize: '32px', fill: '#fff' });
    
    this.input.keyboard.on('keydown-SPACE', fireBullet, this);
}

function update() {
    if (gameOver) return;
    
    if (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).isDown) {
        player.setVelocityX(-200);
    } else if (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).isDown) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }
    
    enemies.children.iterate(function (enemy) {
        enemy.y += 2;
        if (enemy.y > 600) {
            enemy.destroy();
            lives--;
            updateLives();
            if (lives <= 0) {
                gameOver = true;
                this.add.text(300, 250, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' });
            }
        }
    }, this);
}

function createEnemies() {
    enemies.clear(true, true);
    
    const numEnemies = 6 + (stage - 1) * 2;
    for (let i = 0; i < numEnemies; i++) {
        const enemy = enemies.create(
            Phaser.Math.Between(0, 736),
            Phaser.Math.Between(50, 150),
            'enemy'
        );
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(1);
    }
}

function fireBullet() {
    if (gameOver) return;
    
    const bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setVelocityY(-500);
    this.laserSound.play();
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    this.explosionSound.play();
    score += 10;
    updateScore();
    
    if (enemies.countActive(true) === 0) {
        stage++;
        createEnemies();
        updateStage();
    }
}

function updateScore() {
    scoreText.setText('Score: ' + score);
}

function updateLives() {
    livesText.setText('Lives: ' + lives);
}

function updateStage() {
    stageText.setText('Stage: ' + stage);
}