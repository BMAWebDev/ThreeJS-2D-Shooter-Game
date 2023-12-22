import * as THREE from "three";

/**
 * let variables will be updated as rounds keep increasing in order to increase difficulty
 */

const MOVE_SPEED = 12;
let BULLETS_NUMBER = 10;
const BULLET_SHOOT_SPEED = 70;

const MAX_WIDTH = window.innerWidth / 2;
const MIN_WIDTH = -MAX_WIDTH;
const MAX_HEIGHT = window.innerHeight / 2;
const MIN_HEIGHT = -MAX_HEIGHT;

let TIME_TO_RESPAWN = 5; // in seconds

const bulletsContainer = document.querySelector("#bullets-count-container") as HTMLParagraphElement;
const bulletsCountElement = bulletsContainer.querySelector("#bullets-count") as HTMLSpanElement;

const statsContainer = document.querySelector("#stats-container") as HTMLDivElement;
const roundElement = statsContainer.querySelector("#round") as HTMLSpanElement;
const scoreElement = statsContainer.querySelector("#score") as HTMLSpanElement;

const finishedRoundContainer = document.querySelector(
  "#finished-round-container"
) as HTMLDivElement;
const finalScore = finishedRoundContainer.querySelector("#final-score") as HTMLSpanElement;

// START Classes

class Player {
  private bulletsLeft: number;
  private mesh: THREE.Mesh;

  constructor(width: number, height: number, color?: THREE.ColorRepresentation) {
    this.bulletsLeft = BULLETS_NUMBER;
    bulletsCountElement.textContent = this.bulletsLeft.toString();

    const texture = new THREE.TextureLoader().load("/player.png");
    const playerGeometry = new THREE.BoxGeometry(width, height, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: color || 0x00ff00, map: texture });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);

    this.mesh = player;
  }

  public getMesh() {
    return this.mesh;
  }

  public getBulletCount() {
    return this.bulletsLeft;
  }

  public removeBullet() {
    this.bulletsLeft -= 1;

    bulletsCountElement.textContent = this.bulletsLeft.toString();
  }

  public resetBulletsCount() {
    this.bulletsLeft = BULLETS_NUMBER;
    bulletsCountElement.textContent = this.bulletsLeft.toString();
  }
}

class Bullet {
  private mesh: THREE.Mesh;

  constructor() {
    const bulletGeometry = new THREE.BoxGeometry(5, 5, 1);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xec5411 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    const { x, y, z } = playerMesh.position;

    bullet.position.set(x, y + 30, z);

    this.mesh = bullet;
  }

  public getMesh() {
    return this.mesh;
  }
}

class Enemy {
  private mesh: THREE.Mesh;

  constructor() {
    const texture = new THREE.TextureLoader().load("/enemy.png");
    const enemyGeometry = new THREE.BoxGeometry(30, 20, 1);
    const enemyMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

    enemy.position.x = Math.floor(
      Math.random() * (MAX_WIDTH - 30 - (MIN_WIDTH + 30)) + (MIN_WIDTH + 30)
    );
    enemy.position.y += 200;
    this.mesh = enemy;
  }

  public getMesh() {
    return this.mesh;
  }
}

class Game {
  public isFinished: boolean;
  public round: number;
  private score: number;

  constructor() {
    this.round = 0;
    this.score = 0;

    this.startRound();
  }

  public startRound() {
    this.isFinished = false;
    this.round++;

    playerInstance.resetBulletsCount();

    roundElement.textContent = this.round.toString();

    finishedRoundContainer.classList.add("hide");
    bulletsContainer.classList.remove("hide");
    statsContainer.classList.remove("hide");
  }

  public getScore() {
    return this.score;
  }

  public incrementScore(newScore?: number) {
    typeof newScore === "number" ? (this.score += newScore) : this.score++;

    scoreElement.textContent = this.score.toString();
  }
}

// END Classes

const playerInstance = new Player(50, 25, 0xf7a71b);
const playerMesh = playerInstance.getMesh();
const game = new Game();

// START initial setup

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(MIN_WIDTH, MAX_WIDTH, MAX_HEIGHT, MIN_HEIGHT, 1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(playerMesh);

camera.position.z = 5;
playerMesh.position.y = MIN_HEIGHT + 30;

// END initial setup

const handlePlayerMovement = (event: KeyboardEvent) => {
  let newPosition = 0;

  switch (event.key) {
    case "ArrowRight":
      newPosition = playerMesh.position.x + MOVE_SPEED;
      if (newPosition < MAX_WIDTH - 30) playerMesh.position.x = newPosition;
      break;

    case "ArrowLeft":
      newPosition = playerMesh.position.x - MOVE_SPEED;
      if (newPosition > MIN_WIDTH + 30) playerMesh.position.x = newPosition;
      break;

    default:
      break;
  }
};

const getIsEnemyHit = (bullet: THREE.Mesh, enemy: THREE.Mesh) => {
  const bp = bullet.position,
    ep = enemy.position;

  const { width } = (enemy.geometry as any).parameters;

  const isOnXAxis = bp.x >= ep.x - width && bp.x <= ep.x + width;
  const isOnYAxis = bp.y - ep.y > 10;

  return isOnXAxis && isOnYAxis;
};

const handleCollision = (bullet: THREE.Mesh, enemy: THREE.Mesh) => {
  scene.remove(enemy);
  scene.remove(bullet);
  game.incrementScore();
};

const handleFinishRound = () => {
  game.isFinished = true;

  finalScore.textContent = game.getScore().toString();

  bulletsContainer.classList.add("hide");
  statsContainer.classList.add("hide");
  finishedRoundContainer.classList.remove("hide");

  switch (game.round) {
    case 2:
      BULLETS_NUMBER = 8;
      TIME_TO_RESPAWN = 4;
      break;

    case 4:
      BULLETS_NUMBER = 5;
      TIME_TO_RESPAWN = 3;
      break;

    case 6:
      BULLETS_NUMBER = 3;
      break;

    case 9:
      BULLETS_NUMBER = 1;
      break;

    default:
      break;
  }
};

const handleShoot = (event: KeyboardEvent) => {
  if (event.key === " ") {
    // once here in order to prevent calling the bullet;
    if (playerInstance.getBulletCount() === 0) {
      handleFinishRound();

      return;
    }

    playerInstance.removeBullet();

    const bullet = new Bullet().getMesh();
    scene.add(bullet);

    const enemy = scene.getObjectByName("Enemy") as THREE.Mesh;

    const bulletTranslateInterval = setInterval(() => {
      bullet.position.y += 10;

      if (enemy && getIsEnemyHit(bullet, enemy)) {
        handleCollision(bullet, enemy);

        clearInterval(bulletTranslateInterval);
      }

      if (bullet.position.y > MAX_HEIGHT) {
        scene.remove(bullet);

        clearInterval(bulletTranslateInterval);
      }
    }, 1000 / BULLET_SHOOT_SPEED);

    // call it again here in order to reset bullet count
    if (playerInstance.getBulletCount() === 0) {
      handleFinishRound();
    }
  }
};

const handleKeyInput = (event: KeyboardEvent) => {
  handlePlayerMovement(event);

  handleShoot(event);
};

document.addEventListener("keydown", handleKeyInput);

const spawnEnemy = () => {
  const enemyInstance = new Enemy();
  const enemyMesh = enemyInstance.getMesh();

  enemyMesh.name = "Enemy";

  scene.add(enemyMesh);

  setTimeout(() => {
    scene.remove(enemyMesh);
  }, TIME_TO_RESPAWN * 1000);
};

spawnEnemy();

const spawn = () => {
  const enemySpawner = setInterval(() => {
    spawnEnemy();

    // if (playerInstance.getBulletCount() === 0) clearInterval(enemySpawner);
    if (game.isFinished) clearInterval(enemySpawner);
  }, TIME_TO_RESPAWN * 1000);
};

spawn();

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// handlers for finished round buttons
document.querySelector("#confirm-next-round-btn")?.addEventListener("click", () => {
  game.startRound();
  spawn();
});

document
  .querySelector("#close-game-btn")
  ?.addEventListener("click", () =>
    alert(`You have finished the game. Your score is: ${game.getScore()}`)
  );
