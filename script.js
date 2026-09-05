const welcomeScreen = document.getElementById("welcomeScreen");
const cameraScreen = document.getElementById("cameraScreen");
const resultScreen = document.getElementById("resultScreen");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");
const downloadBtn = document.getElementById("downloadBtn");

const video = document.getElementById("video");
const countdown = document.getElementById("countdown");
const flash = document.getElementById("flash");
const shotCounter = document.getElementById("shotCounter");
const cameraHint = document.getElementById("cameraHint");
const miniStrip = document.getElementById("miniStrip");

const captureCanvas = document.getElementById("captureCanvas");
const captureCtx = captureCanvas.getContext("2d");

const finalCanvas = document.getElementById("finalCanvas");
const finalCtx = finalCanvas.getContext("2d");

let stream = null;
let photos = [];
let isCapturing = false;

function showScreen(screen) {
  [welcomeScreen, cameraScreen, resultScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access is needed for the photobooth. Please allow camera permission and refresh the page.");
    showScreen(welcomeScreen);
  }
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCountdown() {
  for (const number of ["3", "2", "1"]) {
    countdown.textContent = number;
    await wait(700);
  }
  countdown.textContent = "♡";
  await wait(260);
  countdown.textContent = "";
}

function takeSnapshot() {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  captureCanvas.width = vw;
  captureCanvas.height = vh;

  // mirror the saved image so it matches the preview
  captureCtx.save();
  captureCtx.translate(vw, 0);
  captureCtx.scale(-1, 1);
  captureCtx.drawImage(video, 0, 0, vw, vh);
  captureCtx.restore();

  flash.classList.remove("active");
  void flash.offsetWidth;
  flash.classList.add("active");

  return captureCanvas.toDataURL("image/jpeg", 0.95);
}

function updateMiniStrip() {
  miniStrip.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    if (photos[i]) {
      const img = document.createElement("img");
      img.src = photos[i];
      img.style.transform = "none";
      miniStrip.appendChild(img);
    } else {
      const empty = document.createElement("div");
      empty.className = "empty-slot";
      empty.textContent = "♡";
      miniStrip.appendChild(empty);
    }
  }
}

async function captureSequence() {
  if (isCapturing) return;
  isCapturing = true;
  captureBtn.disabled = true;

  while (photos.length < 4) {
    const n = photos.length + 1;
    shotCounter.textContent = `photo ${n} of 4`;
    cameraHint.textContent = n === 1 ? "get ready ♡" : "cute! one more ♡";

    await runCountdown();
    photos.push(takeSnapshot());
    updateMiniStrip();

    if (photos.length < 4) {
      await wait(900);
    }
  }

  cameraHint.textContent = "perfect ♡";
  await wait(500);
  await buildFinalStrip();
  stopCamera();
  showScreen(resultScreen);

  captureBtn.disabled = false;
  isCapturing = false;
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const sourceRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (sourceRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawBow(ctx, x, y, scale = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.strokeStyle = "rgba(231, 164, 190, .72)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-18, -17, -34, -9, -26, 5);
  ctx.bezierCurveTo(-18, 15, -6, 6, 0, 0);
  ctx.bezierCurveTo(18, -17, 34, -9, 26, 5);
  ctx.bezierCurveTo(18, 15, 6, 6, 0, 0);
  ctx.moveTo(-4, 5); ctx.quadraticCurveTo(-12, 24, -18, 34);
  ctx.moveTo(4, 5); ctx.quadraticCurveTo(12, 24, 17, 34);
  ctx.stroke();
  ctx.restore();
}

function drawPlush(ctx, x, y, kind, scale = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  const palettes = {
    bunny: ["#cfc7c2", "#8e817d"],
    duck: ["#f2e1af", "#c89b55"],
    bear: ["#d8c59f", "#8c765b"],
    penguin: ["#89929a", "#ece7d8"],
    pastry: ["#e9bd79", "#9c6b3f"],
    cake: ["#f2c8c5", "#a9796f"],
    bee: ["#e4c94f", "#514b43"]
  };
  const [body, detail] = palettes[kind] || palettes.bear;
  ctx.fillStyle = body;
  ctx.strokeStyle = "rgba(120, 90, 80, .16)";
  ctx.lineWidth = 2;
  if (kind === "bunny") {
    ctx.beginPath(); ctx.ellipse(-12,-24,9,26,-.25,0,Math.PI*2); ctx.ellipse(12,-24,9,26,.25,0,Math.PI*2); ctx.fill();
  }
  ctx.beginPath(); ctx.ellipse(0, 8, 30, 33, 0, 0, Math.PI * 2); ctx.fill();
  if (kind === "penguin") {
    ctx.fillStyle = "#f4efe2"; ctx.beginPath(); ctx.ellipse(0,12,19,25,0,0,Math.PI*2); ctx.fill();
  }
  if (kind === "bee") {
    ctx.strokeStyle = detail; ctx.lineWidth = 8;
    [-10,7].forEach(yy=>{ctx.beginPath(); ctx.moveTo(-25,yy); ctx.lineTo(25,yy); ctx.stroke();});
    ctx.fillStyle = "rgba(238,238,238,.8)"; ctx.beginPath(); ctx.ellipse(-26,-8,15,9,-.6,0,Math.PI*2); ctx.ellipse(26,-8,15,9,.6,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = detail;
  ctx.beginPath(); ctx.arc(-9,3,2.8,0,Math.PI*2); ctx.arc(9,3,2.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,13,3.2,0,Math.PI*2); ctx.fill();
  if (kind === "duck") { ctx.fillStyle = "#d79c50"; ctx.beginPath(); ctx.ellipse(0,12,8,4,0,0,Math.PI*2); ctx.fill(); }
  if (kind === "pastry") { ctx.strokeStyle="#a66b3d"; ctx.lineWidth=3; for(let i=-18;i<=18;i+=12){ctx.beginPath();ctx.moveTo(i,-8);ctx.lineTo(i+5,20);ctx.stroke();} }
  if (kind === "cake") { ctx.fillStyle="#fff3e7"; ctx.fillRect(-20,-2,40,22); ctx.fillStyle="#d99cac"; ctx.fillRect(-20,4,40,5); }
  ctx.restore();
}

function drawStripPattern(ctx, W, H) {
  ctx.fillStyle = "#fff8f3";
  ctx.fillRect(0, 0, W, H);
  const bows = [[55,75,.7,-.2],[650,95,.65,.2],[90,410,.65,.12],[635,510,.65,-.15],[70,890,.7,.18],[650,1040,.62,-.2],[75,1430,.65,-.15],[640,1540,.65,.15],[85,1940,.7,.1],[645,2050,.65,-.12]];
  bows.forEach(b => drawBow(ctx, ...b));
  const toys = [
    [95,210,"penguin",.75,-.12],[625,260,"duck",.68,.1],[90,660,"pastry",.72,.16],[625,720,"bunny",.7,-.14],
    [95,1110,"cake",.68,-.1],[625,1190,"bear",.68,.14],[90,1640,"duck",.67,.12],[625,1710,"bee",.65,-.1],
    [95,2150,"bunny",.65,-.1],[625,2200,"pastry",.68,.12]
  ];
  toys.forEach(t => drawPlush(ctx, ...t));
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const sourceRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (sourceRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function buildFinalStrip() {
  const W = 720;
  const photoW = 540;
  const photoH = 405;
  const gap = 24;
  const top = 132;
  const bottom = 120;

  finalCanvas.width = W;
  finalCanvas.height = top + (photoH * 4) + (gap * 3) + bottom;

  finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

  // Use the user-provided cute plush/bow wallpaper as the photo-strip background.
  let borderImg = null;
  try {
    borderImg = await loadImage("assets/strip-border.png");
  } catch (e) {}

  if (borderImg) {
    drawImageCover(finalCtx, borderImg, 0, 0, W, finalCanvas.height);
    finalCtx.fillStyle = "rgba(255, 250, 248, .20)";
    finalCtx.fillRect(0, 0, W, finalCanvas.height);
  } else {
    finalCtx.fillStyle = "#fff8f6";
    finalCtx.fillRect(0, 0, W, finalCanvas.height);
  }

  // Header panel so the wording remains legible over the pattern.
  finalCtx.fillStyle = "rgba(255, 250, 252, .86)";
  drawRoundedRect(finalCtx, 68, 22, W - 136, 92, 28);
  finalCtx.fill();

  finalCtx.textAlign = "center";
  finalCtx.fillStyle = "#dc739e";
  finalCtx.font = "700 20px Arial";
  finalCtx.fillText("the first of our many photobooths", W / 2, 54);

  finalCtx.fillStyle = "#7f3e5b";
  finalCtx.font = "700 31px Arial";
  finalCtx.fillText("For my little one, qiqi ♡", W / 2, 91);

  const imgs = await Promise.all(photos.map(loadImage));

  imgs.forEach((img, i) => {
    const x = (W - photoW) / 2;
    const y = top + i * (photoH + gap);

    // Polaroid-like white frame over the patterned border.
    finalCtx.save();
    finalCtx.shadowColor = "rgba(111, 58, 82, .17)";
    finalCtx.shadowBlur = 16;
    finalCtx.shadowOffsetY = 6;
    finalCtx.fillStyle = "rgba(255,255,255,.97)";
    drawRoundedRect(finalCtx, x - 12, y - 12, photoW + 24, photoH + 24, 24);
    finalCtx.fill();
    finalCtx.restore();

    finalCtx.save();
    drawRoundedRect(finalCtx, x, y, photoW, photoH, 16);
    finalCtx.clip();
    drawImageCover(finalCtx, img, x, y, photoW, photoH);
    finalCtx.restore();

    // tiny pink bow between photos
    if (i < 3) {
      finalCtx.fillStyle = "#df8fae";
      finalCtx.font = "25px Arial";
      finalCtx.fillText("୨୧", W / 2, y + photoH + 21);
    }
  });

  finalCtx.fillStyle = "rgba(255,250,252,.88)";
  drawRoundedRect(finalCtx, 120, finalCanvas.height - 82, W - 240, 52, 24);
  finalCtx.fill();

  finalCtx.fillStyle = "#9a5874";
  finalCtx.font = "700 22px Arial";
  finalCtx.fillText("another memory for us ♡", W / 2, finalCanvas.height - 48);
}
function resetBooth() {
  photos = [];
  updateMiniStrip();
  shotCounter.textContent = "photo 1 of 4";
  cameraHint.textContent = "get ready ♡";
}

startBtn.addEventListener("click", async () => {
  resetBooth();
  showScreen(cameraScreen);
  await startCamera();
});

backBtn.addEventListener("click", () => {
  stopCamera();
  resetBooth();
  showScreen(welcomeScreen);
});

captureBtn.addEventListener("click", captureSequence);

retakeBtn.addEventListener("click", async () => {
  resetBooth();
  showScreen(cameraScreen);
  await startCamera();
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "our-little-photobooth.png";
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
});
