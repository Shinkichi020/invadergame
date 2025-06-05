import pygame
import random
import math
from pygame import mixer

# Pygameの初期化
pygame.init()

# ゲームウィンドウの設定
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("インベーダーゲーム")
icon = pygame.image.load('ufo.png')
pygame.display.set_icon(icon)

# プレイヤーの設定
class Player:
    def __init__(self):
        self.image = pygame.image.load('player.png')
        self.x = 370
        self.y = 480
        self.x_change = 0
        self.lives = 3

    def draw(self):
        screen.blit(self.image, (self.x, self.y))

# 敵の設定
class Enemy:
    def __init__(self, stage):
        self.image = pygame.image.load('enemy.png')
        self.x = random.randint(0, 736)
        self.y = random.randint(50, 150)
        self.x_change = 4 + (stage * 0.5)
        self.y_change = 40

    def draw(self):
        screen.blit(self.image, (self.x, self.y))

# 弾の設定
class Bullet:
    def __init__(self):
        self.image = pygame.image.load('bullet.png')
        self.x = 0
        self.y = 480
        self.y_change = -10
        self.state = "ready"

    def fire(self, x, y):
        self.state = "fire"
        self.x = x
        self.y = y
        screen.blit(self.image, (x + 16, y + 10))

def is_collision(enemy_x, enemy_y, bullet_x, bullet_y):
    distance = math.sqrt(math.pow(enemy_x - bullet_x, 2) + math.pow(enemy_y - bullet_y, 2))
    return distance < 27

def show_lives(x, y, lives):
    font = pygame.font.Font('freesansbold.ttf', 32)
    lives_text = font.render(f"Lives: {lives}", True, (255, 255, 255))
    screen.blit(lives_text, (x, y))

def show_stage(x, y, stage):
    font = pygame.font.Font('freesansbold.ttf', 32)
    stage_text = font.render(f"Stage: {stage}", True, (255, 255, 255))
    screen.blit(stage_text, (x, y))

def show_game_over():
    font = pygame.font.Font('freesansbold.ttf', 64)
    game_over_text = font.render("GAME OVER", True, (255, 0, 0))
    screen.blit(game_over_text, (200, 250))

def show_victory():
    font = pygame.font.Font('freesansbold.ttf', 64)
    victory_text = font.render("VICTORY!", True, (0, 255, 0))
    screen.blit(victory_text, (250, 250))

def create_fireworks():
    fireworks = []
    for _ in range(10):
        x = random.randint(0, 800)
        y = random.randint(0, 600)
        color = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
        fireworks.append((x, y, color))
    return fireworks

def draw_fireworks(fireworks):
    for x, y, color in fireworks:
        pygame.draw.circle(screen, color, (x, y), 10)

# ゲームの初期設定
player = Player()
bullet = Bullet()
enemies = []
num_enemies = 6
stage = 1
score = 0
running = True

# ステージ開始時に敵を生成
def spawn_enemies():
    enemies.clear()
    for i in range(num_enemies + (stage - 1) * 2):
        enemies.append(Enemy(stage))

spawn_enemies()

# ゲームループ
while running:
    screen.fill((0, 0, 0))
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                player.x_change = -5
            if event.key == pygame.K_RIGHT:
                player.x_change = 5
            if event.key == pygame.K_SPACE:
                if bullet.state == "ready":
                    bullet_sound = mixer.Sound('laser.wav')
                    bullet_sound.play()
                    bullet.fire(player.x, player.y)
        
        if event.type == pygame.KEYUP:
            if event.key == pygame.K_LEFT or event.key == pygame.K_RIGHT:
                player.x_change = 0

    # プレイヤーの動き
    player.x += player.x_change
    if player.x <= 0:
        player.x = 0
    elif player.x >= 736:
        player.x = 736

    # 弾の動き
    if bullet.y <= 0:
        bullet.y = 480
        bullet.state = "ready"
    if bullet.state == "fire":
        bullet.fire(bullet.x, bullet.y)
        bullet.y += bullet.y_change

    # 敵の動きと衝突判定
    for i, enemy in enumerate(enemies):
        # ゲームオーバーの判定
        if enemy.y > 440:
            for e in enemies:
                e.y = 2000
            player.lives -= 1
            if player.lives <= 0:
                show_game_over()
                pygame.display.update()
                pygame.time.delay(2000)
                running = False
            else:
                spawn_enemies()
            break

        enemy.x += enemy.x_change
        if enemy.x <= 0:
            enemy.x_change = 4 + (stage * 0.5)
            enemy.y += enemy.y_change
        elif enemy.x >= 736:
            enemy.x_change = -4 - (stage * 0.5)
            enemy.y += enemy.y_change

        # 衝突の判定
        if is_collision(enemy.x, enemy.y, bullet.x, bullet.y):
            explosion_sound = mixer.Sound('explosion.wav')
            explosion_sound.play()
            bullet.y = 480
            bullet.state = "ready"
            score += 1
            enemy.x = random.randint(0, 736)
            enemy.y = random.randint(50, 150)

        enemy.draw()

    # ステージクリアの判定
    if score >= num_enemies + (stage - 1) * 2:
        stage += 1
        score = 0
        spawn_enemies()
        if stage > 5:
            show_victory()
            fireworks = create_fireworks()
            while fireworks:
                screen.fill((0, 0, 0))
                draw_fireworks(fireworks)
                fireworks = []  # 花火のアニメーションを一度だけ表示
                pygame.display.update()
                pygame.time.delay(1000)
            running = False

    player.draw()
    show_lives(10, 10, player.lives)
    show_stage(650, 10, stage)
    
    pygame.display.update()
