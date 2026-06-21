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
        timeLimit: 30,
        timeLeft: 30,
        score: 0,
        started: false,
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
        bubbles: [],
        pickupEffects: [],
        scorePopups: []
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

      function resetGame(started = true) {
        game.timeLeft = game.timeLimit;
        game.score = 0;
        game.started = started;
        game.ended = false;
        game.pointer.active = false;
        game.pointer.diveHold = false;
        game.whale.x = game.width * 0.5;
        game.whale.y = game.surfaceY;
        game.whale.oxygen = 1;
        game.whale.diving = false;
        game.bubbles = [];
        game.pickupEffects = [];
        game.scorePopups = [];
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
        game.foods.push(createSquid());
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

      function createSquid() {
        const food = {
          type: "squid",
          score: 30,
          x: 0,
          y: 0,
          radius: 16,
          direction: 1,
          speed: random(74, 92),
          active: false,
          respawnAt: performance.now() + random(6000, 11000),
          respawnMin: 8000,
          respawnMax: 15000
        };
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

      function spawnSquid(food) {
        const band = foodDepthBand("squid");
        food.direction = Math.random() < 0.5 ? -1 : 1;
        food.x = food.direction === 1 ? -34 : game.width + 34;
        food.y = random(band.top, band.bottom);
        food.speed = random(74, 92);
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
        if (type === "squid") {
          return {
            top: game.surfaceY + seaDepth * 0.76,
            bottom: game.surfaceY + seaDepth * 0.92
          };
        }
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
        if (food.type === "squid") {
          spawnSquid(food);
          return;
        }
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
        const pos = pointerPosition(event);

        if (!game.started) {
          resetGame(true);
          return;
        }

        if (game.ended) {
          if (isRetryButtonHit(pos.x, pos.y)) {
            resetGame(true);
            canvas.style.cursor = "default";
          }
          return;
        }

        const now = performance.now();
        game.pointer.active = true;
        game.pointer.x = pos.x;
        game.pointer.y = pos.y;
        game.pointer.diveHold = now - game.pointer.lastDownAt < 320;
        game.pointer.lastDownAt = now;
      }

      function isRetryButtonHit(x, y) {
        const panelHeight = 190;
        const panelY = (game.height - panelHeight) / 2;
        const button = {
          x: game.width / 2 - 70,
          y: panelY + 128,
          width: 140,
          height: 38
        };
        return x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height;
      }

      function onPointerMove(event) {
        if (event.touches) {
          if (!game.pointer.active) return;
          event.preventDefault();
          const pos = pointerPosition(event);
          game.pointer.x = pos.x;
          game.pointer.y = pos.y;
          return;
        }

        const pos = pointerPosition(event);
        updateCursor(pos);
        if (!game.pointer.active) return;
        event.preventDefault();
        game.pointer.x = pos.x;
        game.pointer.y = pos.y;
      }

      function updateCursor(pos) {
        canvas.style.cursor = game.ended && isRetryButtonHit(pos.x, pos.y) ? "pointer" : "default";
      }

      function onPointerUp(event) {
        event.preventDefault();
        game.pointer.active = false;
        game.pointer.diveHold = false;
      }

      function update(delta) {
        if (!game.started) return;
        if (game.ended) return;

        if (Number.isFinite(game.timeLimit)) {
          game.timeLeft = Math.max(0, game.timeLeft - delta);
          if (game.timeLeft <= 0) {
            game.ended = true;
            game.pointer.active = false;
            game.pointer.diveHold = false;
            canvas.style.cursor = "default";
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
        updatePickupFeedback(delta);
      }

      function updateFoods(delta) {
        for (const food of game.foods) {
          if (!food.active) {
            if (performance.now() >= food.respawnAt) {
              respawnFood(food);
            }
            continue;
          }

          if (food.type === "squid") {
            updateSquid(food, delta);
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

      function updateSquid(food, delta) {
        food.x += food.direction * food.speed * delta;
        food.y += Math.sin(performance.now() * 0.004 + food.x * 0.03) * delta * 10;
        const band = foodDepthBand("squid");
        food.y = clamp(food.y, band.top, band.bottom);

        const passedRight = food.direction === 1 && food.x > game.width + 44;
        const passedLeft = food.direction === -1 && food.x < -44;
        if (passedRight || passedLeft) {
          food.active = false;
          food.respawnAt = performance.now() + random(food.respawnMin, food.respawnMax);
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
            addPickupFeedback(food, whale);
            food.active = false;
            food.respawnAt = performance.now() + random(food.respawnMin, food.respawnMax);
          }
        }
      }

      function addPickupFeedback(food, whale) {
        const isBigScore = food.score >= 30;
        game.pickupEffects.push({
          x: food.x,
          y: food.y,
          score: food.score,
          life: isBigScore ? 0.68 : 0.42,
          maxLife: isBigScore ? 0.68 : 0.42,
          radius: isBigScore ? 28 : 10 + Math.min(food.score, 30) * 0.3
        });
        game.scorePopups.push({
          x: whale.x,
          y: whale.y - whale.radius - 10,
          score: food.score,
          text: `+${food.score}`,
          life: isBigScore ? 1.05 : 0.78,
          maxLife: isBigScore ? 1.05 : 0.78
        });
      }

      function updatePickupFeedback(delta) {
        for (let i = game.pickupEffects.length - 1; i >= 0; i -= 1) {
          const effect = game.pickupEffects[i];
          effect.life -= delta;
          effect.radius += delta * 46;
          if (effect.life <= 0) {
            game.pickupEffects.splice(i, 1);
          }
        }

        for (let i = game.scorePopups.length - 1; i >= 0; i -= 1) {
          const popup = game.scorePopups[i];
          popup.life -= delta;
          popup.y -= delta * 34;
          if (popup.life <= 0) {
            game.scorePopups.splice(i, 1);
          }
        }
      }

      function draw() {
        window.KujiraRender.draw(ctx, game);
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
      resetGame(false);
      requestAnimationFrame(loop);
    })();
