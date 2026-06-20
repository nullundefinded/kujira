(() => {
      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d");
      const BASE_WIDTH = 390;
      const BASE_HEIGHT = 844;

      const game = {
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        screenWidth: 0,
        screenHeight: 0,
        dpr: 1,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        timeLimit: Infinity,
        timeLeft: Infinity,
        score: 0,
        ended: false,
        lastTime: 0,
        surfaceY: 0,
        pointer: {
          active: false,
          x: 0,
          y: 0,
          diveHold: false,
          lastDownAt: 0
        },
        whale: {
          x: 0,
          y: 0,
          radius: 28,
          oxygen: 1,
          diving: false
        },
        foods: [],
        bubbles: []
      };

      function resize() {
        game.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        game.screenWidth = window.innerWidth;
        game.screenHeight = window.innerHeight;
        game.width = BASE_WIDTH;
        game.height = BASE_HEIGHT;
        game.scale = Math.min(game.screenWidth / BASE_WIDTH, game.screenHeight / BASE_HEIGHT);
        game.offsetX = (game.screenWidth - BASE_WIDTH * game.scale) / 2;
        game.offsetY = (game.screenHeight - BASE_HEIGHT * game.scale) / 2;
        canvas.width = Math.floor(game.screenWidth * game.dpr);
        canvas.height = Math.floor(game.screenHeight * game.dpr);
        canvas.style.width = `${game.screenWidth}px`;
        canvas.style.height = `${game.screenHeight}px`;
        ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
        game.surfaceY = Math.max(96, Math.floor(game.height * 0.28));
        game.whale.radius = Math.max(22, Math.min(34, game.width * 0.07));
        game.whale.x = clamp(game.whale.x || game.width * 0.5, game.whale.radius, game.width - game.whale.radius);
        game.whale.y = game.whale.y || game.surfaceY;
        setupFoods();
      }

      function resetGame() {
        game.timeLeft = game.timeLimit;
        game.score = 0;
        game.ended = false;
        game.pointer.active = false;
        game.pointer.diveHold = false;
        game.whale.x = game.width * 0.5;
        game.whale.y = game.surfaceY;
        game.whale.oxygen = 1;
        game.whale.diving = false;
        game.bubbles = [];
        setupFoods();
        game.lastTime = performance.now();
      }

      function setupFoods() {
        if (!game.width || !game.height) return;
        game.foods = [];
        for (let i = 0; i < 3; i += 1) {
          game.foods.push(createPlankton());
        }
        game.foods.push(createKrill());
      }

      function createPlankton() {
        const food = {
          type: "plankton",
          score: 1,
          x: 0,
          y: 0,
          radius: random(5, 7),
          direction: Math.random() < 0.5 ? -1 : 1,
          speed: random(12, 24),
          drift: random(0.6, 1.2),
          active: true,
          respawnAt: 0,
          respawnMin: 850,
          respawnMax: 1250
        };
        placePlankton(food);
        return food;
      }

      function createKrill() {
        const food = {
          type: "krill",
          score: 3,
          x: 0,
          y: 0,
          radius: 9,
          direction: Math.random() < 0.5 ? -1 : 1,
          speed: 0,
          burstSpeed: 0,
          burstTimer: 0,
          pauseTimer: 0,
          drift: random(1.0, 1.6),
          active: true,
          respawnAt: 0,
          respawnMin: 3000,
          respawnMax: 5000
        };
        placeKrill(food);
        return food;
      }

      function placePlankton(food) {
        const margin = 32;
        const band = foodDepthBand("plankton");
        food.x = random(margin, game.width - margin);
        food.y = random(band.top, band.bottom);
        food.direction = Math.random() < 0.5 ? -1 : 1;
        food.speed = random(12, 24);
        food.active = true;
      }

      function placeKrill(food) {
        const margin = 34;
        const band = foodDepthBand("krill");
        food.x = random(margin, game.width - margin);
        food.y = random(band.top, band.bottom);
        food.direction = Math.random() < 0.5 ? -1 : 1;
        startKrillBurst(food);
        food.active = true;
      }

      function startKrillBurst(food) {
        food.direction = Math.random() < 0.5 ? -1 : 1;
        food.burstSpeed = random(260, 340);
        food.speed = food.burstSpeed;
        food.burstTimer = random(0.72, 1.05);
        food.burstDuration = food.burstTimer;
        food.pauseTimer = 0;
      }

      function foodDepthBand(type) {
        const seaDepth = game.height - game.surfaceY;
        if (type === "krill") {
          return {
            top: game.surfaceY + seaDepth * 0.48,
            bottom: game.surfaceY + seaDepth * 0.7
          };
        }
        return {
          top: game.surfaceY + seaDepth * 0.16,
          bottom: game.surfaceY + seaDepth * 0.42
        };
      }

      function respawnFood(food) {
        if (food.type === "krill") {
          placeKrill(food);
          return;
        }
        placePlankton(food);
      }

      function pointerPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;
        return {
          x: clamp((point.clientX - rect.left - game.offsetX) / game.scale, 0, game.width),
          y: clamp((point.clientY - rect.top - game.offsetY) / game.scale, 0, game.height)
        };
      }

      function onPointerDown(event) {
        event.preventDefault();
        if (game.ended) {
          resetGame();
          return;
        }

        const now = performance.now();
        const pos = pointerPosition(event);
        game.pointer.active = true;
        game.pointer.x = pos.x;
        game.pointer.y = pos.y;
        game.pointer.diveHold = now - game.pointer.lastDownAt < 320;
        game.pointer.lastDownAt = now;
      }

      function onPointerMove(event) {
        if (!game.pointer.active) return;
        event.preventDefault();
        const pos = pointerPosition(event);
        game.pointer.x = pos.x;
        game.pointer.y = pos.y;
      }

      function onPointerUp(event) {
        event.preventDefault();
        game.pointer.active = false;
        game.pointer.diveHold = false;
      }

      function update(delta) {
        if (game.ended) return;

        if (Number.isFinite(game.timeLimit)) {
          game.timeLeft = Math.max(0, game.timeLeft - delta);
          if (game.timeLeft <= 0) {
            game.ended = true;
            game.pointer.active = false;
            game.pointer.diveHold = false;
            return;
          }
        }

        const whale = game.whale;
        const canDive = game.pointer.active && game.pointer.diveHold && whale.oxygen > 0;
        whale.diving = canDive;

        if (whale.diving) {
          whale.oxygen = Math.max(0, whale.oxygen - delta * 0.18);
          moveTowardAxes(whale, game.pointer.x, Math.max(game.surfaceY + 42, game.pointer.y), {
            x: 120 * delta,
            down: 135 * delta,
            up: 220 * delta
          });
          if (Math.random() < delta * 6) {
            game.bubbles.push({
              x: whale.x - whale.radius * 0.45,
              y: whale.y - whale.radius * 0.2,
              r: random(2, 5),
              life: 1
            });
          }
        } else {
          const targetX = game.pointer.active ? game.pointer.x : whale.x;
          moveToward(whale, targetX, game.surfaceY, 250 * delta);
          if (whale.y <= game.surfaceY + 1) {
            whale.oxygen = Math.min(1, whale.oxygen + delta * 0.42);
          }
        }

        whale.x = clamp(whale.x, whale.radius, game.width - whale.radius);
        whale.y = clamp(whale.y, game.surfaceY, game.height - whale.radius);

        for (let i = game.bubbles.length - 1; i >= 0; i -= 1) {
          const bubble = game.bubbles[i];
          bubble.y -= delta * 42;
          bubble.life -= delta * 0.8;
          if (bubble.life <= 0 || bubble.y < game.surfaceY) {
            game.bubbles.splice(i, 1);
          }
        }

        updateFoods(delta);
        checkFoodCollisions();
      }

      function updateFoods(delta) {
        for (const food of game.foods) {
          if (!food.active) {
            if (performance.now() >= food.respawnAt) {
              respawnFood(food);
            }
            continue;
          }

          if (food.type === "krill") {
            updateKrill(food, delta);
          } else {
            food.x += food.direction * food.speed * delta;
            food.y += Math.sin(performance.now() * 0.003 * food.drift + food.x * 0.02) * delta * 8;
          }

          const band = foodDepthBand(food.type);
          food.y = clamp(food.y, band.top, band.bottom);
          if (food.x < 24 || food.x > game.width - 24) {
            food.x = clamp(food.x, 24, game.width - 24);
            food.direction *= -1;
            if (food.type === "krill") {
              food.pauseTimer = random(0.2, 0.45);
              food.burstTimer = 0;
              food.speed = 0;
            }
          }
        }
      }

      function updateKrill(food, delta) {
        if (food.pauseTimer > 0) {
          food.pauseTimer -= delta;
          food.speed = 0;
          if (food.pauseTimer <= 0) {
            startKrillBurst(food);
          }
          return;
        }

        food.burstTimer -= delta;
        const progress = clamp(food.burstTimer / food.burstDuration, 0, 1);
        food.speed = Math.max(0, food.burstSpeed * progress);
        food.x += food.direction * food.speed * delta;
        food.y += Math.sin(performance.now() * 0.01 + food.x * 0.08) * delta * 34;

        if (food.burstTimer <= 0 || food.speed < 18) {
          food.speed = 0;
          food.pauseTimer = random(0.35, 0.8);
        }
      }

      function checkFoodCollisions() {
        const whale = game.whale;
        for (const food of game.foods) {
          if (!food.active) continue;

          const dx = whale.x - food.x;
          const dy = whale.y - food.y;
          if (Math.hypot(dx, dy) < whale.radius * 0.72 + food.radius) {
            game.score += food.score;
            food.active = false;
            food.respawnAt = performance.now() + random(food.respawnMin, food.respawnMax);
          }
        }
      }

      function draw() {
        ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
        ctx.clearRect(0, 0, game.screenWidth, game.screenHeight);
        ctx.fillStyle = "#051624";
        ctx.fillRect(0, 0, game.screenWidth, game.screenHeight);

        ctx.save();
        ctx.translate(game.offsetX, game.offsetY);
        ctx.scale(game.scale, game.scale);
        drawWorld();
        drawFoods();
        drawBubbles();
        drawWhale();
        drawHud();
        if (game.ended) drawResult();
        ctx.restore();
      }

      function drawWorld() {
        const sky = ctx.createLinearGradient(0, 0, 0, game.surfaceY);
        sky.addColorStop(0, "#8fd2ec");
        sky.addColorStop(1, "#d9f5ff");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, game.width, game.surfaceY);

        const sea = ctx.createLinearGradient(0, game.surfaceY, 0, game.height);
        sea.addColorStop(0, "#1281a6");
        sea.addColorStop(0.48, "#0b557e");
        sea.addColorStop(1, "#07324f");
        ctx.fillStyle = sea;
        ctx.fillRect(0, game.surfaceY, game.width, game.height - game.surfaceY);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = -20; x <= game.width + 20; x += 18) {
          const y = game.surfaceY + Math.sin((x + performance.now() * 0.08) * 0.04) * 4;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        for (let i = 0; i < 6; i += 1) {
          const x = ((performance.now() * 0.015 + i * 130) % (game.width + 140)) - 70;
          ctx.fillRect(x, game.surfaceY + 60 + i * 54, 90, 2);
        }
      }

      function drawFoods() {
        for (const food of game.foods) {
          if (!food.active) continue;
          if (food.type === "krill") {
            drawKrill(food);
          } else {
            drawPlankton(food);
          }
        }
      }

      function drawPlankton(food) {
        ctx.save();
        ctx.translate(food.x, food.y);
        ctx.scale(food.direction, 1);
        ctx.fillStyle = "#f7df72";
        ctx.strokeStyle = "rgba(92, 64, 24, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, food.radius * 1.35, food.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(247, 223, 114, 0.85)";
        ctx.lineWidth = 1.2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(-food.radius * 0.4, i * 2);
          ctx.quadraticCurveTo(-food.radius * 1.4, i * 5, -food.radius * 2.2, i * 4);
          ctx.stroke();
        }

        ctx.fillStyle = "#312610";
        ctx.beginPath();
        ctx.arc(food.radius * 0.55, -food.radius * 0.18, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function drawKrill(food) {
        ctx.save();
        ctx.translate(food.x, food.y);
        ctx.scale(food.direction, 1);
        ctx.fillStyle = "#ff7b6b";
        ctx.strokeStyle = "#812b2b";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffb1a6";
        ctx.beginPath();
        ctx.ellipse(5, -0.5, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 177, 166, 0.9)";
        ctx.lineWidth = 1.2;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(-5, i * 2);
          ctx.lineTo(-15, i * 4);
          ctx.stroke();
        }

        ctx.fillStyle = "#2f1212";
        ctx.beginPath();
        ctx.arc(8.5, -1.4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function drawBubbles() {
        for (const bubble of game.bubbles) {
          ctx.globalAlpha = Math.max(0, bubble.life) * 0.55;
          ctx.strokeStyle = "#d7f8ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      function drawWhale() {
        const whale = game.whale;
        const facing = game.pointer.active && game.pointer.x < whale.x ? -1 : 1;
        const bob = Math.sin(performance.now() * 0.006) * 2;

        ctx.save();
        ctx.translate(whale.x, whale.y + bob);
        ctx.scale(facing, 1);

        ctx.fillStyle = "#254f78";
        ctx.strokeStyle = "#0d2946";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, whale.radius * 1.25, whale.radius * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#d7eef7";
        ctx.beginPath();
        ctx.ellipse(whale.radius * 0.2, whale.radius * 0.22, whale.radius * 0.62, whale.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#254f78";
        ctx.beginPath();
        ctx.moveTo(-whale.radius * 1.08, -whale.radius * 0.08);
        ctx.lineTo(-whale.radius * 1.78, -whale.radius * 0.46);
        ctx.lineTo(-whale.radius * 1.5, 0);
        ctx.lineTo(-whale.radius * 1.78, whale.radius * 0.46);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#173554";
        ctx.beginPath();
        ctx.arc(whale.radius * 0.66, -whale.radius * 0.18, whale.radius * 0.07, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(215, 238, 247, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(whale.radius * 0.7, whale.radius * 0.04, whale.radius * 0.24, 0.15, 1.25);
        ctx.stroke();

        ctx.restore();
      }

      function drawHud() {
        const pad = 14;
        const barWidth = Math.min(170, game.width - pad * 2);

        ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
        roundRect(pad, pad, 136, 44, 8);
        ctx.fill();
        ctx.fillStyle = "#f7fbff";
        ctx.font = "700 18px system-ui, sans-serif";
        ctx.fillText(`Score ${game.score}`, pad + 14, pad + 28);

        ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
        roundRect(game.width - pad - 118, pad, 118, 44, 8);
        ctx.fill();
        ctx.fillStyle = "#f7fbff";
        ctx.textAlign = "right";
        ctx.fillText(Number.isFinite(game.timeLeft) ? `${Math.ceil(game.timeLeft)}s` : "FREE", game.width - pad - 14, pad + 28);
        ctx.textAlign = "left";

        const y = pad + 56;
        ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
        roundRect(pad, y, barWidth, 18, 7);
        ctx.fill();
        ctx.fillStyle = game.whale.oxygen < 0.22 ? "#ff8b73" : "#8ce7ff";
        roundRect(pad + 3, y + 3, Math.max(0, (barWidth - 6) * game.whale.oxygen), 12, 5);
        ctx.fill();
      }

      function drawResult() {
        ctx.fillStyle = "rgba(3, 15, 28, 0.72)";
        ctx.fillRect(0, 0, game.width, game.height);

        const panelWidth = Math.min(320, game.width - 36);
        const panelHeight = 190;
        const x = (game.width - panelWidth) / 2;
        const y = (game.height - panelHeight) / 2;

        ctx.fillStyle = "#f7fbff";
        roundRect(x, y, panelWidth, panelHeight, 8);
        ctx.fill();

        ctx.fillStyle = "#12324e";
        ctx.textAlign = "center";
        ctx.font = "700 26px system-ui, sans-serif";
        ctx.fillText("Result", game.width / 2, y + 50);
        ctx.font = "700 42px system-ui, sans-serif";
        ctx.fillText(String(game.score), game.width / 2, y + 104);

        ctx.fillStyle = "#0d6f95";
        roundRect(game.width / 2 - 70, y + 128, 140, 38, 8);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 17px system-ui, sans-serif";
        ctx.fillText("Retry", game.width / 2, y + 153);
        ctx.textAlign = "left";
      }

      function loop(time) {
        const delta = Math.min(0.05, (time - game.lastTime) / 1000 || 0);
        game.lastTime = time;
        update(delta);
        draw();
        requestAnimationFrame(loop);
      }

      function moveToward(body, targetX, targetY, distance) {
        const dx = targetX - body.x;
        const dy = targetY - body.y;
        const length = Math.hypot(dx, dy);
        if (length <= distance || length === 0) {
          body.x = targetX;
          body.y = targetY;
          return;
        }
        body.x += dx / length * distance;
        body.y += dy / length * distance;
      }

      function moveTowardAxes(body, targetX, targetY, speed) {
        const dx = targetX - body.x;
        const dy = targetY - body.y;
        const stepX = Math.sign(dx) * Math.min(Math.abs(dx), speed.x);
        const yLimit = dy > 0 ? speed.down : speed.up;
        const stepY = Math.sign(dy) * Math.min(Math.abs(dy), yLimit);
        body.x += stepX;
        body.y += stepY;
      }

      function roundRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
      }

      function random(min, max) {
        return min + Math.random() * (max - min);
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      window.addEventListener("resize", resize);
      canvas.addEventListener("mousedown", onPointerDown);
      canvas.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      canvas.addEventListener("touchstart", onPointerDown, { passive: false });
      canvas.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp, { passive: false });
      window.addEventListener("touchcancel", onPointerUp, { passive: false });
      canvas.addEventListener("contextmenu", (event) => event.preventDefault());

      resize();
      resetGame();
      requestAnimationFrame(loop);
    })();
