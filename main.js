const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
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

let bird;
let obstacles;
let cursors;
let lives = 5;
let livesText;
let gameOver = false;
let gameOverText;
let obstacleTimer = 0;
let obstacleInterval = 2000; // Time in ms between obstacles
let difficultyIncrease = 0.99; // Multiplier to decrease interval over time
let score = 0;
let scoreText;

function preload() {
  this.load.image('background', 'assets/background.png');
  this.load.image('bird', 'assets/bird.png');
  this.load.image('plane', 'assets/plane.png');
  this.load.image('helicopter', 'assets/helicopter.png');
}

function create() {
  // Add background
  this.add.image(400, 300, 'background');

  // Create bird
  bird = this.physics.add.sprite(100, 300, 'bird');
  bird.setCollideWorldBounds(true);

  // Create obstacles group
  obstacles = this.physics.add.group();

  // Create lives text
  livesText = this.add.text(16, 16, 'Lives: ' + lives, { fontSize: '32px', fill: '#000' });

  // Create score text
  scoreText = this.add.text(16, 50, 'Score: ' + score, { fontSize: '32px', fill: '#000' });

  // Enable input
  cursors = this.input.keyboard.createCursorKeys();

  // Collision detection
  this.physics.add.overlap(bird, obstacles, hitObstacle, null, this);
}

function update(time, delta) {
  if (gameOver) {
    if (cursors.space.isDown) {
      // Restart the game
      this.scene.restart();
      lives = 5;
      obstacleInterval = 2000;
      gameOver = false;
      score = 0;
    }
    return;
  }

  // Bird flapping
  if (cursors.space.isDown) {
    bird.setVelocityY(-300);
  }

  // Spawn obstacles
  obstacleTimer += delta;
  if (obstacleTimer > obstacleInterval) {
    obstacleTimer = 0;
    spawnObstacle(this);
    // Increase difficulty by decreasing the interval
    obstacleInterval *= difficultyIncrease;
  }

  // Remove off-screen obstacles
  obstacles.getChildren().forEach(function(obstacle) {
    if (obstacle.x < -50) {
      obstacle.destroy();
    }
  });

  // Update score
  score += delta / 1000; // Increase score over time
  scoreText.setText('Score: ' + Math.floor(score));
}

function spawnObstacle(scene) {
  const obstacleType = Phaser.Math.RND.pick(['plane', 'helicopter']);
  const obstacleY = Phaser.Math.Between(50, 550);
  const obstacle = obstacles.create(850, obstacleY, obstacleType);
  obstacle.setVelocityX(-200);
  obstacle.setCollideWorldBounds(false);
  obstacle.setImmovable(true);
}

function hitObstacle(bird, obstacle) {
  obstacle.destroy();
  lives -= 1;
  livesText.setText('Lives: ' + lives);

  if (lives <= 0) {
    gameOver = true;
    gameOverText = this.add.text(400, 300, 'Game Over! Press SPACE to Restart', { fontSize: '32px', fill: '#000' });
    gameOverText.setOrigin(0.5);
  }
}
