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

async function buildFinalStrip() {
  const W = 700;
  const photoW = 600;
  const photoH = 450;
  const gap = 28;
  const top = 90;
  const bottom = 155;

  finalCanvas.width = W;
  finalCanvas.height = top + (photoH * 4) + (gap * 3) + bottom;

  // background
  finalCtx.fillStyle = "#fff8fb";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // outer pink frame
  finalCtx.fillStyle = "#f6bfd4";
  finalCtx.fillRect(0, 0, W, 58);

  finalCtx.fillStyle = "#7b3f58";
  finalCtx.textAlign = "center";
  finalCtx.font = "700 30px Arial";
  finalCtx.fillText("OUR LITTLE PHOTOBOOTH ♡", W / 2, 40);

  const imgs = await Promise.all(photos.map(loadImage));

  imgs.forEach((img, i) => {
    const x = (W - photoW) / 2;
    const y = top + i * (photoH + gap);

    // crop to 4:3
    const sourceRatio = img.width / img.height;
    const targetRatio = photoW / photoH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (sourceRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }

    finalCtx.drawImage(img, sx, sy, sw, sh, x, y, photoW, photoH);

    // tiny rounded pink corner marker
    finalCtx.fillStyle = "rgba(255, 220, 233, .92)";
    finalCtx.beginPath();
    finalCtx.arc(x + photoW - 26, y + 27, 16, 0, Math.PI * 2);
    finalCtx.fill();
    finalCtx.fillStyle = "#a94e73";
    finalCtx.font = "18px Arial";
    finalCtx.fillText("♡", x + photoW - 26, y + 33);
  });

  const footerY = finalCanvas.height - 92;
  finalCtx.fillStyle = "#a45176";
  finalCtx.font = "28px Arial";
  finalCtx.fillText("another memory for us ♡", W / 2, footerY);

  finalCtx.fillStyle = "#d98aac";
  finalCtx.font = "20px Arial";
  finalCtx.fillText(new Date().toLocaleDateString(), W / 2, footerY + 38);
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
