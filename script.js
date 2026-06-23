const canvas = document.getElementById("star-canvas");
const ctx = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let stars = [];
let width = 0;
let height = 0;
let pointerX = 0;
let pointerY = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(150, Math.max(75, Math.floor((width * height) / 12500)));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.4 + 0.25,
    alpha: Math.random() * 0.7 + 0.25,
    speed: Math.random() * 0.012 + 0.004,
    drift: Math.random() * 0.18 + 0.04
  }));
}

function drawStars(time = 0) {
  ctx.clearRect(0, 0, width, height);

  stars.forEach((star, index) => {
    const twinkle = Math.sin(time * star.speed + index) * 0.32 + star.alpha;
    const x = star.x + pointerX * star.drift;
    const y = star.y + pointerY * star.drift;

    ctx.beginPath();
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.12, Math.min(0.95, twinkle))})`;
    ctx.fill();
  });

  if (!reducedMotion) {
    requestAnimationFrame(drawStars);
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawStars();
});

window.addEventListener("mousemove", (event) => {
  const centerX = width / 2;
  const centerY = height / 2;
  pointerX = (event.clientX - centerX) / centerX;
  pointerY = (event.clientY - centerY) / centerY;
  document.documentElement.style.setProperty("--tilt-x", pointerX.toFixed(2));
  document.documentElement.style.setProperty("--tilt-y", pointerY.toFixed(2));
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });
});

resizeCanvas();
drawStars();
