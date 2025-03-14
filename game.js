// The Whale $WIP Runner - Phaser.js Game

// Persist and retrieve the high score from localStorage.
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;

///////////////////////////////////////////////////////////
// MAIN MENU SCENE
///////////////////////////////////////////////////////////
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        // Title
        this.add.text(400, 200, 'The Whale $WIP Runner', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Start Game Button
        this.add.text(400, 300, 'Start Game', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.start('GameScene');
            });

        // Controls Button
        this.add.text(400, 350, 'Controls', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.start('ControlsScene');
            });

        // Donation Button
        this.add.text(400, 400, 'Game Support Donation', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.showDonationAddress();
            });
    }

    showDonationAddress() {
        const address = 'DjazFdEfH1ZQ4vYrg6pYoxEphj7qZFiVxWWL8gMtGwqs';
        const donationText = this.add.text(400, 450, `SOL: ${address}`, {
            fontSize: '18px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                navigator.clipboard.writeText(address);
                donationText.setText('Address Copied!');
            });
    }
}

///////////////////////////////////////////////////////////
// CONTROLS SCENE
///////////////////////////////////////////////////////////
class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        // Title
        this.add.text(400, 200, 'Controls', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 300, '- Press SPACE or UP to fly', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 350, '- Avoid the Bears 🐻', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 400, '- Get the highest score!', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Back Button
        this.add.text(400, 500, 'Back', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
    }
}

///////////////////////////////////////////////////////////
// GAME SCENE
///////////////////////////////////////////////////////////
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameStarted = false;
        this.gameOver = false;
        this.spawnTimer = null;
    }

    preload() {
        this.load.image('sky', 'sky-background.png');
        this.load.image('whale', 'whale.png');
        this.load.image('obstacle', 'bear-obstacle.png');
        this.load.audio('music', 'arcade-music.wav');
    }

    create() {
        // Ensure a fresh start
        this.physics.resume();
        this.gameOver = false;
        this.gameStarted = true;

        // Background
        this.background = this.add.tileSprite(400, 300, 800, 600, 'sky');
        this.background.tilePositionX = 0; // reset background scroll if returning from menu

        // Whale
        this.whale = this.physics.add.sprite(100, 300, 'whale');
        this.whale.clearTint();
        this.whale.setPosition(100, 300);
        this.whale.setScale(0.2);
        this.whale.setCollideWorldBounds(true);
        this.whale.body.allowGravity = true;
        this.whale.setActive(true).setVisible(true);

        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', () => this.flap());

        // Obstacles group
        this.obstacles = this.physics.add.group();

        // Score tracking
        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff'
        });
        this.highScoreText = this.add.text(20, 50, `High Score: ${highScore}`, {
            fontSize: '24px',
            fill: '#fff'
        });

        // Collision detection
        this.physics.add.collider(this.whale, this.obstacles, this.hitObstacle, null, this);

        // Music
        this.music = this.sound.add('music', { loop: true, volume: 0.5 });
        this.music.play();

        // Mute button
        this.muteButton = this.add.text(750, 20, '🔊', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.toggleMute());

        // Obstacle spawn timer
        this.spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.addObstacle,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (!this.gameStarted || this.gameOver) return;

        // Scroll background
        this.background.tilePositionX += 2 + this.score / 100;

        // Score increment
        this.obstacles.children.iterate(obstacle => {
            if (obstacle.x < 100 && !obstacle.getData('scored')) {
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
                obstacle.setData('scored', true);
            }
        });

        // Flap with space or up arrow
        if (this.cursors.space.isDown || this.cursors.up.isDown) {
            this.flap();
        }
    }

    addObstacle() {
        if (this.gameOver) return;
        let obstacle = this.obstacles.create(800, Phaser.Math.Between(200, 500), 'obstacle');
        obstacle.setScale(0.15);
        obstacle.setVelocityX(-200 - this.score / 10);
        obstacle.body.allowGravity = false;
    }

    flap() {
        if (!this.gameOver) {
            this.whale.setVelocityY(-200);
        }
    }

    hitObstacle() {
        // End game
        this.gameOver = true;
        this.whale.setTint(0xff0000);
        this.physics.pause();

        // Stop new obstacles from spawning
        if (this.spawnTimer) {
            this.spawnTimer.remove(false);
        }

        // Check high score
        if (this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('highScore', highScore);
            this.highScoreText.setText(`High Score: ${highScore}`);
        }

        // Show game over text
        this.add.text(400, 250, 'Game Over', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Restart button
        this.add.text(400, 300, 'Restart', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.restartGame());

        // WIP it to X
        this.add.text(400, 350, '$WIP it to X', {
            fontSize: '24px',
            fill: '#1DA1F2',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => this.postScoreOnX());

        // Back to Main Menu
        this.add.text(400, 400, 'Back to Menu', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000'
        })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.music.stop();
                if (this.spawnTimer) {
                    this.spawnTimer.remove(false);
                }
                this.scene.start('MainMenu');
            });
    }

    restartGame() {
        // Stop music
        this.music.stop();
        // Stop spawn timer
        if (this.spawnTimer) {
            this.spawnTimer.remove(false);
        }

        // Restart entire scene for a fresh start
        this.scene.restart();
    }

    postScoreOnX() {
        let postText = `Join the $WIP community! Show us your highest score. Let's whale out and beat these bears! 🐋🔥 My high score: ${highScore} #WIPRUNNER  Join us: https://x.com/TheWhaleWip`;
        let postUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
        window.open(postUrl, '_blank');
    }

    toggleMute() {
        if (this.music.isPlaying) {
            this.music.pause();
            this.muteButton.setText('🔇');
        } else {
            this.music.resume();
            this.muteButton.setText('🔊');
        }
    }
}

///////////////////////////////////////////////////////////
// FINAL CONFIG & GAME
///////////////////////////////////////////////////////////
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
    scene: [MainMenu, ControlsScene, GameScene]
};

const game = new Phaser.Game(config);
