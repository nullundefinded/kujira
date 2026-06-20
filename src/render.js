(() => {
  function draw(ctx, game) {
    ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
    ctx.clearRect(0, 0, game.screenWidth, game.screenHeight);
    ctx.fillStyle = "#051624";
    ctx.fillRect(0, 0, game.screenWidth, game.screenHeight);

    ctx.save();
    ctx.translate(game.offsetX, game.offsetY);
    ctx.scale(game.scale, game.scale);
    drawWorld(ctx, game);
    drawFoods(ctx, game);
    drawBubbles(ctx, game);
    drawWhale(ctx, game);
    drawHud(ctx, game);
    if (game.ended) drawResult(ctx, game);
    ctx.restore();
  }

  function drawWorld(ctx, game) {
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

  function drawFoods(ctx, game) {
    for (const food of game.foods) {
      if (!food.active) continue;
      if (food.type === "krill") {
        drawKrill(ctx, food);
      } else {
        drawPlankton(ctx, food);
      }
    }
  }

  function drawPlankton(ctx, food) {
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

  function drawKrill(ctx, food) {
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

  function drawBubbles(ctx, game) {
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

  function drawWhale(ctx, game) {
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

  function drawHud(ctx, game) {
    const pad = 14;
    const barWidth = Math.min(170, game.width - pad * 2);

    ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
    roundRect(ctx, pad, pad, 136, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(`Score ${game.score}`, pad + 14, pad + 28);

    ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
    roundRect(ctx, game.width - pad - 118, pad, 118, 44, 8);
    ctx.fill();
    ctx.fillStyle = "#f7fbff";
    ctx.textAlign = "right";
    ctx.fillText(Number.isFinite(game.timeLeft) ? `${Math.ceil(game.timeLeft)}s` : "FREE", game.width - pad - 14, pad + 28);
    ctx.textAlign = "left";

    const y = pad + 56;
    ctx.fillStyle = "rgba(5, 22, 36, 0.58)";
    roundRect(ctx, pad, y, barWidth, 18, 7);
    ctx.fill();
    ctx.fillStyle = game.whale.oxygen < 0.22 ? "#ff8b73" : "#8ce7ff";
    roundRect(ctx, pad + 3, y + 3, Math.max(0, (barWidth - 6) * game.whale.oxygen), 12, 5);
    ctx.fill();
  }

  function drawResult(ctx, game) {
    ctx.fillStyle = "rgba(3, 15, 28, 0.72)";
    ctx.fillRect(0, 0, game.width, game.height);

    const panelWidth = Math.min(320, game.width - 36);
    const panelHeight = 190;
    const x = (game.width - panelWidth) / 2;
    const y = (game.height - panelHeight) / 2;

    ctx.fillStyle = "#f7fbff";
    roundRect(ctx, x, y, panelWidth, panelHeight, 8);
    ctx.fill();

    ctx.fillStyle = "#12324e";
    ctx.textAlign = "center";
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText("Result", game.width / 2, y + 50);
    ctx.font = "700 42px system-ui, sans-serif";
    ctx.fillText(String(game.score), game.width / 2, y + 104);

    ctx.fillStyle = "#0d6f95";
    roundRect(ctx, game.width / 2 - 70, y + 128, 140, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 17px system-ui, sans-serif";
    ctx.fillText("Retry", game.width / 2, y + 153);
    ctx.textAlign = "left";
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  window.KujiraRender = { draw };
})();
