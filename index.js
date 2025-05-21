const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Player {
  constructor({ position, velocity }) {
    this.position = position; 
    this.velocity = velocity;
    this.rotation = 0;
  }

  draw() {
    c.save();

    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);

    c.beginPath();
    c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
    c.closePath();

    c.beginPath();
    c.moveTo(this.position.x + 30, this.position.y);
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10);
    c.closePath();

    c.strokeStyle = "white";
    c.stroke();
    c.fillStyle = "red";
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  getVerticies() {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ];
  }
}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.closePath();
    c.fillStyle = "orange";
    c.strokeStyle = "white";
    c.fill();
    c.stroke();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.rotation = Math.random() * Math.PI * 2;

    this.vertices = [];
    const steps = Math.floor(Math.random() * 5 + 5);

    for (let i = 0; i < steps; i++) {
      const angle = (Math.PI * 2 * i) / steps;
      const variation = Math.random() * 0.4 + 0.8;
      this.vertices.push({
        x: Math.cos(angle) * this.radius * variation,
        y: Math.sin(angle) * this.radius * variation,
      });
    }
  }

  draw() {
    // Random shape asteroids
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);

    c.beginPath();
    const first = this.vertices[0];
    c.moveTo(first.x, first.y);
    for (let i = 1; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      c.lineTo(v.x, v.y);
    }
    c.closePath();

    c.fillStyle = "grey";
    c.strokeStyle = "white";
    c.fill();
    c.stroke();

    c.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.rotation += 0.005;
  }
}

const player = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};

const projectiles = [];
const asteroids = [];
const stars = [];

let score = 0;
let asteroidSpeedMultiplier = 0.5;

const SPEED = 6;
const ROTATIONAL_SPEED = 0.1;
const FRICTION = 0.96;
const PROJECTILE_SPEED = 7;
const ASTEROID_SPEED = 2;
const numberOfStars = 200;

for (let i = 0; i < numberOfStars; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  });
}

const intervalId = window.setInterval(() => {
  const index = Math.floor(Math.random() * 4);

  let x, y;
  let vx, vy;
  let radius = 50 * Math.random() + 10;

  switch (index) {
    case 0: // left side of the screen
      x = 0 - radius;
      y = Math.random() * canvas.height;
      break;
    case 1: // bottom side of the screen
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      break;
    case 2: // right side of the screen
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      break;
    case 3: // top side of the screen
      x = Math.random() * canvas.width;
      y = 0 + radius;
      break;
  }

  const targetX = Math.random() * canvas.width;
  const targetY = Math.random() * canvas.height;
  const angle = Math.atan2(targetY - y, targetX - x);
  vx = Math.cos(angle) * ASTEROID_SPEED * asteroidSpeedMultiplier;
  vy = Math.sin(angle) * ASTEROID_SPEED * asteroidSpeedMultiplier;

  asteroids.push(
    new Asteroid({
      position: {
        x: x,
        y: y,
      },
      velocity: {
        x: vx,
        y: vy,
      },
      radius,
    })
  );
  console.log(asteroids);
}, 1000);


function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;

  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );

  if (distance <= circle1.radius + circle2.radius) {
    return true;
  }

  return false;
}

function circleTriangleCollision(circle, triangle) {
  // Check if the "circle" (AKA randomly shaped asteroid acting as a circle) is colliding with any of triangle's edges
  for (let i = 0; i < 3; i++) {
    let start = triangle[i];
    let end = triangle[(i + 1) % 3];

    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let length = Math.sqrt(dx * dx + dy * dy);

    let dot =
      ((circle.position.x - start.x) * dx +
        (circle.position.y - start.y) * dy) /
      Math.pow(length, 2);

    let closestX = start.x + dot * dx;
    let closestY = start.y + dot * dy;

    if (!isPointOnLineSegment(closestX, closestY, start, end)) {
      closestX = closestX < start.x ? start.x : end.x;
      closestY = closestY < start.y ? start.y : end.y;
    }

    dx = closestX - circle.position.x;
    dy = closestY - circle.position.y;

    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      return true;
    }
  }
  // No collision
  return false;
}

function isPointOnLineSegment(x, y, start, end) {
  return (
    x >= Math.min(start.x, end.x) &&
    x <= Math.max(start.x, end.x) &&
    y >= Math.min(start.y, end.y) &&
    y <= Math.max(start.y, end.y)
  );
}

function animate() {
  const animationId = window.requestAnimationFrame(animate);

  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    c.beginPath();
    c.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
    c.closePath();
    c.fillStyle = "white";
    c.fill();
  }

  c.fillStyle = "white";
  c.font = "24px Arial";
  c.fillText("Score: " + score, 20, 40);

  player.update();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.update();

    // garbage collection for projectiles
    if (
      projectile.position.x + projectile.radius < 0 ||
      projectile.position.x - projectile.radius > canvas.width ||
      projectile.position.y - projectile.radius > canvas.height ||
      projectile.position.y + projectile.radius < 0
    ) {
      projectiles.splice(i, 1);
    }
  }
  // asteroid management
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    if (circleTriangleCollision(asteroid, player.getVerticies())) {
      alert("GAME OVER");
      window.cancelAnimationFrame(animationId);
      clearInterval(intervalId);
      score = 0;
    }

    // garbage collection for asteroids
    if (
      asteroid.position.x + asteroid.radius < 0 ||
      asteroid.position.x - asteroid.radius > canvas.width ||
      asteroid.position.y - asteroid.radius > canvas.height ||
      asteroid.position.y + asteroid.radius < 0
    ) {
      asteroids.splice(i, 1);
    }
    //projectiles
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];

      if (circleCollision(asteroid, projectile)) {
        projectiles.splice(j, 1);
        if (asteroid.radius > 20) {
          const newRadius = asteroid.radius / 2;

          // split asteroid into 2 and shoot them in different angles
          for (let k = 0; k < 2; k++) {
            const angle = Math.random() * Math.PI * 2;

            asteroids.push(
              new Asteroid({
                position: {
                  x: asteroid.position.x,
                  y: asteroid.position.y,
                },
                velocity: {
                  x: Math.cos(angle) * ASTEROID_SPEED,
                  y: Math.sin(angle) * ASTEROID_SPEED,
                },
                radius: newRadius,
              })
            );
          }
        } else {
          score += 1;
          asteroidSpeedMultiplier += 1;

          for (let astroid of asteroids) {
            const speed = Math.hypot(asteroid.velocity.x, asteroid.velocity.y);
            const angle = Math.atan2(asteroid.velocity.y, asteroid.velocity.x);
            const newSpeed = speed + 1;

            asteroid.velocity.x = Math.cos(angle) * newSpeed;
            asteroid.velocity.y = Math.sin(angle) * newSpeed;
          }
        }
        asteroids.splice(i, 1);
        break;
      }
    }
  }

  if (keys.w.pressed) {
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;
  } else if (!keys.w.pressed) {
    player.velocity.x *= FRICTION;
    player.velocity.y *= FRICTION;
  }

  if (keys.d.pressed) player.rotation += ROTATIONAL_SPEED;
  else if (keys.a.pressed) player.rotation -= ROTATIONAL_SPEED;
}

animate();

window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      keys.w.pressed = true;
      break;
    case "KeyA":
    case "ArrowLeft":
      keys.a.pressed = true;
      break;
    case "KeyD":
    case "ArrowRight":
      keys.d.pressed = true;
      break;
    case "Space":
      projectiles.push(
        new Projectile({
          position: {
            x: player.position.x + Math.cos(player.rotation) * 30,
            y: player.position.y + Math.sin(player.rotation) * 30,
          },
          velocity: {
            x: Math.cos(player.rotation) * PROJECTILE_SPEED,
            y: Math.sin(player.rotation) * PROJECTILE_SPEED,
          },
        })
      );

      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      keys.w.pressed = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      keys.a.pressed = false;
      break;
    case "KeyD":
    case "ArrowRight":
      keys.d.pressed = false;
      break;
  }
});
