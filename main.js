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

// New variables for nuggets and power-ups
let nuggets;
let nuggetTimer = 0;
let nuggetInterval = 3000; // Time in ms between nuggets appearing
let nuggetDuration = 5000; // Nuggets last for 5 seconds

let powerUps;
let powerUpTimer = 0;
let powerUpInterval = 10000; // Time in ms between power-ups appearing
let powerUpDuration = 5000; // Power-ups last for 5 seconds
let isShieldActive = false;
let shieldTimer;
let isSpeedBoostActive = false;
let speedBoostTimer;

function preload() {
  this.load.image('background', 'assets/background.png');
  this.load.image('bird', 'assets/bird.png');
  this.load.image('plane', 'assets/plane.png');
  this.load.image('helicopter', 'assets/helicopter.png');
  this.load.image('golden_nugget', 'assets/golden_nugget.png');
  this.load.image('extra_life', 'assets/extra_life.png');
  this.load.image('shield', 'assets/shield.png');
  this.load.image('speed_boost', 'assets/speed_boost.png');
}

function create() {
  // Add background
  const background = this.add.image(0, 0, 'background');
  background.setOrigin(0, 0);
  background.setDisplaySize(800, 600);

  // Create bird
  bird = this.physics.add.sprite(100, 300, 'bird');
  bird.setCollideWorldBounds(true);
  bird.body.allowGravity = true;
  bird.setDisplaySize(50, 50);

  // Create obstacles group
  obstacles = this.physics.add.group();

  // Create nuggets group
  nuggets = this.physics.add.group();

  // Create power-ups group
  powerUps = this.physics.add.group();

  // Create texts
  livesText = this.add.text(16, 16, 'Lives: ' + lives, { fontSize: '32px', fill: '#000' });
  scoreText = this.add.text(16, 50, 'Score: ' + score, { fontSize: '32px', fill: '#000' });

  // Enable input
  cursors = this.input.keyboard.createCursorKeys();

  // Collision detection
  this.physics.add.overlap(bird, obstacles, hitObstacle, null, this);
  this.physics.add.overlap(bird, nuggets, collectNugget, null, this);
  this.physics.add.overlap(bird, powerUps, collectPowerUp, null, this);
}

function update(time, delta) {
  if (gameOver) {
    if (cursors.space.isDown) {
      // Restart the game
      this.scene.restart();
      lives = 5;
      obstacleInterval = 2000;
      nuggetInterval = 3000;
      powerUpInterval = 10000;
      gameOver = false;
      score = 0;
      isShieldActive = false;
      isSpeedBoostActive = false;
    }
    return;
  }

  // Adjust speeds based on power-ups
  let horizontalSpeed = 200;
  let verticalSpeed = -300;

  if (isSpeedBoostActive) {
    horizontalSpeed = 400; // Increase speed
    verticalSpeed = -600;  // Increase flapping strength
  }

  // Reset bird's horizontal velocity
  bird.setVelocityX(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    bird.setVelocityX(-horizontalSpeed); // Move left
  } else if (cursors.right.isDown) {
    bird.setVelocityX(horizontalSpeed); // Move right
  }

  // Vertical movement (flapping)
  if (cursors.space.isDown) {
    bird.setVelocityY(verticalSpeed); // Flap upwards
  }

  // Spawn obstacles
  obstacleTimer += delta;
  if (obstacleTimer > obstacleInterval) {
    obstacleTimer = 0;
    spawnObstacle(this);
    // Increase difficulty by decreasing the interval
    obstacleInterval *= difficultyIncrease;
  }

  // Spawn golden nuggets
  nuggetTimer += delta;
  if (nuggetTimer > nuggetInterval) {
    nuggetTimer = 0;
    spawnNugget(this);
  }

  // Spawn power-ups
  powerUpTimer += delta;
  if (powerUpTimer > powerUpInterval) {
    powerUpTimer = 0;
    spawnPowerUp(this);
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
  const possibleYPositions = [100, 200, 300, 400, 500];
  const obstacleY = Phaser.Math.RND.pick(possibleYPositions);
  const obstacle = obstacles.create(850, obstacleY, obstacleType);

  // Set obstacle sizes
  if (obstacleType === 'plane') {
    obstacle.setDisplaySize(100, 50);
  } else {
    obstacle.setDisplaySize(80, 60);
  }

  // Disable gravity for the obstacle
  obstacle.body.allowGravity = false;

  // Set horizontal velocity
  obstacle.setVelocityX(-200); // Move left at 200 pixels/second

  // Ensure vertical velocity is zero
  obstacle.setVelocityY(0);

  // Set the obstacle to be immovable
  obstacle.setImmovable(true);
}

function hitObstacle(bird, obstacle) {
  obstacle.destroy();

  if (isShieldActive) {
    // Ignore damage
    return;
  }

  lives -= 1;
  livesText.setText('Lives: ' + lives);

  if (lives <= 0) {
    gameOver = true;
    gameOverText = this.add.text(400, 300, 'Game Over! Press SPACE to Restart', { fontSize: '32px', fill: '#000' });
    gameOverText.setOrigin(0.5);
  }
}

function spawnNugget(scene) {
  const nuggetX = Phaser.Math.Between(50, 750);
  const nuggetY = Phaser.Math.Between(50, 550);
  const nugget = nuggets.create(nuggetX, nuggetY, 'golden_nugget');

  // Set nugget size
  nugget.setDisplaySize(30, 30);

  // Disable gravity
  nugget.body.allowGravity = false;

  // Set a timer to destroy the nugget after a duration
  scene.time.addEvent({
    delay: nuggetDuration,
    callback: () => {
      if (nugget) {
        nugget.destroy();
      }
    }
  });
}

function collectNugget(bird, nugget) {
  nugget.destroy();
  score += 10; // Increase score by 10 points
  scoreText.setText('Score: ' + Math.floor(score));
}

function spawnPowerUp(scene) {
  const powerUpTypes = ['extra_life', 'shield', 'speed_boost'];
  const powerUpType = Phaser.Math.RND.pick(powerUpTypes);
  const powerUpX = Phaser.Math.Between(50, 750);
  const powerUpY = Phaser.Math.Between(50, 550);
  const powerUp = powerUps.create(powerUpX, powerUpY, powerUpType);

  // Set power-up size
  powerUp.setDisplaySize(30, 30);

  // Store the type in the power-up object
  powerUp.powerUpType = powerUpType;

  // Disable gravity
  powerUp.body.allowGravity = false;

  // Set a timer to destroy the power-up after a duration
  scene.time.addEvent({
    delay: powerUpDuration,
    callback: () => {
      if (powerUp) {
        powerUp.destroy();
      }
    }
  });
}

function collectPowerUp(bird, powerUp) {
  const type = powerUp.powerUpType;
  powerUp.destroy();

  if (type === 'extra_life') {
    // Grant an extra life
    lives += 1;
    livesText.setText('Lives: ' + lives);
  } else if (type === 'shield') {
    // Activate shield
    activateShield(this);
  } else if (type === 'speed_boost') {
    // Activate speed boost
    activateSpeedBoost(this);
  }
}

function activateShield(scene) {
  if (isShieldActive) {
    // Reset the timer if shield is already active
    shieldTimer.remove(false);
  } else {
    isShieldActive = true;
    // Optionally, change the bird's appearance to indicate shield
  }

  // Set timer to deactivate shield after duration
  shieldTimer = scene.time.addEvent({
    delay: 5000, // Shield lasts for 5 seconds
    callback: () => {
      isShieldActive = false;
      // Reset bird's appearance if changed
    }
  });
}

function activateSpeedBoost(scene) {
  if (isSpeedBoostActive) {
    // Reset the timer if speed boost is already active
    speedBoostTimer.remove(false);
  } else {
    isSpeedBoostActive = true;
    // Optionally, change the bird's appearance to indicate speed boost
  }

  // Set timer to deactivate speed boost after duration
  speedBoostTimer = scene.time.addEvent({
    delay: 5000, // Speed boost lasts for 5 seconds
    callback: () => {
      isSpeedBoostActive = false;
      // Reset bird's appearance if changed
    }
  });
}
