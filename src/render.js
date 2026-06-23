(() => {
  const foodImages = {
    plankton: loadImage("assets/images/plankton.png"),
    krill: loadImage("assets/images/krill.png"),
    squid: loadImage("assets/images/squid.png")
  };
  const whaleImage = loadImage("assets/images/whale.png");
  const whaleTiredImage = loadImage("assets/images/whale-tired.png");
  const spoutImage = loadImage("assets/images/spout.png");
  const LOW_OXYGEN_RATIO = 0.22;

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function draw(ctx, game) {
    ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
    ctx.clearRect(0, 0, game.screenWidth, game.screenHeight);
    ctx.fillStyle = "#051624";
    ctx.fillRect(0, 0, game.screenWidth, game.screenHeight);

    ctx.save();
    ctx.translate(game.offsetX, game.offsetY);
    ctx.scale(game.scale, game.scale);
    drawWorld(ctx, game);
    if (!game.started) {
      drawTitle(ctx, game);
      ctx.restore();
      return;
    }

    drawFoods(ctx, game);
    drawPickupEffects(ctx, game);
    drawBubbles(ctx, game);
    drawWhale(ctx, game);
    drawSpouts(ctx, game);
    drawScorePopups(ctx, game);
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

  function drawPickupEffects(ctx, game) {
    for (const effect of game.pickupEffects) {
      const alpha = Math.max(0, effect.life / effect.maxLife);
      const progress = 1 - alpha;
      const isBigScore = effect.score >= 30;
      const rayCount = isBigScore ? 14 : 8;
      const rayLength = (isBigScore ? 24 : 12) + progress * (isBigScore ? 30 : 16);

      ctx.save();
      ctx.globalAlpha = alpha;
      if (isBigScore) {
        const glow = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.radius * 2.1);
        glow.addColorStop(0, "rgba(255, 255, 255, 0.65)");
        glow.addColorStop(0.36, "rgba(255, 207, 79, 0.42)");
        glow.addColorStop(1, "rgba(255, 207, 79, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = effect.score >= 10 ? "#ffcf4f" : "#e8fbff";
      ctx.lineWidth = (isBigScore ? 5 : 3) - progress * 1.5;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (isBigScore) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius * 1.45, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = effect.score >= 10 ? "rgba(255, 242, 168, 0.95)" : "rgba(210, 249, 255, 0.95)";
      ctx.lineWidth = isBigScore ? 3 : 2;
      for (let i = 0; i < rayCount; i += 1) {
        const angle = i / rayCount * Math.PI * 2;
        const inner = effect.radius * 0.55;
        const outer = inner + rayLength * (i % 2 === 0 ? 1 : 0.68);
        ctx.beginPath();
        ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
        ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawFoods(ctx, game) {
    for (const food of game.foods) {
      if (!food.active) continue;
      if (food.type === "squid") {
        drawSquid(ctx, food);
      } else if (food.type === "krill") {
        drawKrill(ctx, food);
      } else {
        drawPlankton(ctx, food);
      }
    }
  }

  function drawPlankton(ctx, food) {
    if (drawFoodImage(ctx, food, "plankton", 32, 32)) return;

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
    if (drawFoodImage(ctx, food, "krill", 42, 28, -food.direction)) return;

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

  function drawSquid(ctx, food) {
    if (drawFoodImage(ctx, food, "squid", 46, 38)) return;

    ctx.save();
    ctx.translate(food.x, food.y);
    ctx.scale(food.direction, 1);

    ctx.fillStyle = "#d9d0ff";
    ctx.strokeStyle = "#51458f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-2, -13);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-14, 7);
    ctx.lineTo(-2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#d9d0ff";
    ctx.lineWidth = 2.2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-12, i * 3);
      ctx.quadraticCurveTo(-24, i * 5, -31, i * 3);
      ctx.stroke();
    }

    ctx.fillStyle = "#211b42";
    ctx.beginPath();
    ctx.arc(5, -3.5, 2.2, 0, Math.PI * 2);
    ctx.arc(5, 3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFoodImage(ctx, food, type, width, height, facing = food.direction) {
    const image = foodImages[type];
    if (!image || !image.complete || image.naturalWidth === 0) return false;

    ctx.save();
    ctx.translate(food.x, food.y);
    ctx.scale(facing, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
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

  function drawSpouts(ctx, game) {
    for (const spout of game.spouts) {
      const alpha = Math.max(0, spout.life / spout.maxLife);
      const progress = 1 - alpha;
      const grow = easeOutBack(Math.min(1, progress / 0.45));
      const fade = alpha < 0.28 ? alpha / 0.28 : 1;
      const width = game.whale.radius * (0.58 + grow * 1.82);
      const imageReady = spoutImage.complete && spoutImage.naturalWidth > 0;
      const height = imageReady ? width * spoutImage.naturalHeight / spoutImage.naturalWidth : width * 0.9;

      ctx.save();
      ctx.globalAlpha = fade * 0.95;
      if (imageReady) {
        ctx.drawImage(spoutImage, spout.x - width / 2, spout.y - height - grow * 4, width, height);
      } else {
        drawFallbackSpout(ctx, spout, width, height);
      }
      ctx.restore();
    }
  }

  function drawFallbackSpout(ctx, spout, width, height) {
    ctx.fillStyle = "#62d8f5";
    ctx.beginPath();
    ctx.ellipse(spout.x, spout.y - height * 0.56, width * 0.12, height * 0.45, 0, 0, Math.PI * 2);
    ctx.ellipse(spout.x - width * 0.28, spout.y - height * 0.44, width * 0.22, height * 0.12, -0.45, 0, Math.PI * 2);
    ctx.ellipse(spout.x + width * 0.28, spout.y - height * 0.44, width * 0.22, height * 0.12, 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function drawWhale(ctx, game) {
    const whale = game.whale;
    const facing = game.pointer.active && game.pointer.x < whale.x ? -1 : 1;
    const bob = Math.sin(performance.now() * 0.006) * 2;

    ctx.save();
    ctx.translate(whale.x, whale.y + bob);
    ctx.scale(facing, 1);

    if (drawWhaleImage(ctx, whale)) {
      ctx.restore();
      return;
    }

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

  function drawWhaleImage(ctx, whale) {
    const oxygenRatio = Math.max(0, Math.min(1, whale.oxygen / whale.oxygenMax));
    const preferredImage = oxygenRatio < LOW_OXYGEN_RATIO ? whaleTiredImage : whaleImage;
    const image = preferredImage.complete && preferredImage.naturalWidth > 0 ? preferredImage : whaleImage;
    if (!image.complete || image.naturalWidth === 0) return false;

    const width = whale.radius * 4.1;
    const height = width * image.naturalHeight / image.naturalWidth;
    const yOffset = -whale.radius * 0.28;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, -height / 2 + yOffset, width, height);
    ctx.restore();
    return true;
  }

  function drawScorePopups(ctx, game) {
    for (const popup of game.scorePopups) {
      const alpha = Math.max(0, popup.life / popup.maxLife);
      const rise = 1 - alpha;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.font = `900 ${popup.score >= 30 ? 32 : 22}px 'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif`;
      ctx.lineWidth = popup.score >= 30 ? 7 : 5;
      if (popup.score >= 30) {
        ctx.shadowColor = "rgba(255, 207, 79, 0.85)";
        ctx.shadowBlur = 12;
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeText(popup.text, popup.x, popup.y - rise * 4);
      ctx.fillStyle = popup.score >= 10 ? "#ffcf4f" : popup.score >= 3 ? "#ff9b6b" : "#f7fbff";
      ctx.fillText(popup.text, popup.x, popup.y - rise * 4);
      ctx.restore();
    }
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
    const oxygenRatio = Math.max(0, Math.min(1, game.whale.oxygen / game.whale.oxygenMax));
    ctx.fillStyle = oxygenRatio < LOW_OXYGEN_RATIO ? "#ff8b73" : "#8ce7ff";
    roundRect(ctx, pad + 3, y + 3, Math.max(0, (barWidth - 6) * oxygenRatio), 12, 5);
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

  function drawTitle(ctx, game) {
    ctx.textAlign = "center";
    ctx.lineJoin = "round";

    ctx.font = "900 44px 'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText("ほえー、くじら！", game.width / 2, 300);
    ctx.fillStyle = "#ffcf4f";
    ctx.fillText("ほえー、くじら！", game.width / 2, 300);

    ctx.font = "800 20px 'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText("〜30秒もぐもぐチャレンジ〜", game.width / 2, 338);
    ctx.fillStyle = "#46b8d8";
    ctx.fillText("〜30秒もぐもぐチャレンジ〜", game.width / 2, 338);

    ctx.font = "800 18px 'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText("Tap / Click Start", game.width / 2, 404);
    ctx.fillStyle = "#0d6f95";
    ctx.fillText("Tap / Click Start", game.width / 2, 404);

    const x = game.width / 2;
    const y = 482;
    ctx.font = "700 16px 'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillStyle = "#12324e";
    drawCenteredText(ctx, "長押し: 海面を移動", x, y);
    drawCenteredText(ctx, "ダブルタップ後に長押し: 潜水", x, y + 34);
    drawCenteredText(ctx, "海面に戻ると酸素が回復", x, y + 68);
    ctx.textAlign = "left";
  }

  function drawCenteredText(ctx, text, x, y) {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
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
