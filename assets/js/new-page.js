// new-page-init.js
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.embedded-new-page');
  if (!container) return;

  // Add a wrapper for content (if your template uses {{{content}}} directly, wrap it)
  let content = container.querySelector('.content-wrapper');
  if (!content) {
    // wrap existing children so they stay above canvas
    content = document.createElement('div');
    content.className = 'content-wrapper';
    // move children into content wrapper
    while (container.firstChild) {
      content.appendChild(container.firstChild);
    }
    container.appendChild(content);
  }

  // Create canvas behind content
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  container.insertBefore(canvas, content);

  const ctx = canvas.getContext('2d', { alpha: true });

  // Respect reduced motion preference
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    // draw a single, subtle static blob and exit
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStaticBlob();
    return;
  }

  // Configuration (tweak these)
  const PARTICLE_COUNT = Math.max(6, Math.round((container.offsetWidth * container.offsetHeight) / 90000)); // scalable count
  const MIN_RADIUS = 40;
  const MAX_RADIUS = 160;
  const SPEED = 0.15; // global speed multiplier (smaller = slower)

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let particles = [];
  let lastTime = performance.now();

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticles() {
    particles = [];
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = rand(MIN_RADIUS, MAX_RADIUS);
      particles.push({
        x: rand(-w * 0.25, w * 1.25),
        y: rand(-h * 0.25, h * 1.25),
        r,
        vx: rand(-0.05, 0.05) * (r / 60) * SPEED * 60,
        vy: rand(-0.05, 0.05) * (r / 60) * SPEED * 60,
        alpha: rand(0.12, 0.45),
      });
    }
  }

  function resizeCanvas() {
    // size the canvas in device pixels for crispness
    DPR = Math.max(1, window.devicePixelRatio || 1);
    const rect = container.getBoundingClientRect();
    canvas.width = Math.ceil(rect.width * DPR);
    canvas.height = Math.ceil(rect.height * DPR);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // scale drawing to CSS pixels
  }

  function draw(now) {
    const dt = Math.min(32, now - lastTime) / 16.6667; // normalized delta (approx frames)
    lastTime = now;

    const w = canvas.width / DPR;
    const h = canvas.height / DPR;

    ctx.clearRect(0, 0, w, h);

    // Soft black radial blobs using globalCompositeOperation 'lighter' to get melded dark shapes
    ctx.globalCompositeOperation = 'source-over';

    for (let p of particles) {
      // update
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // gentle wrap-around so blobs feel endless
      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;
      if (p.y > h + p.r) p.y = -p.r;

      // draw radial gradient circle
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      // center is nearly black with alpha, edges transparent
      const alphaCenter = p.alpha;
      grd.addColorStop(0, `rgba(0,0,0,${alphaCenter})`);
      grd.addColorStop(0.45, `rgba(0,0,0,${alphaCenter * 0.45})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle global dim so blobs are moody
    ctx.globalCompositeOperation = 'source-over';
    // Next frame
    requestAnimationFrame(draw);
  }

  function drawStaticBlob() {
    const w = canvas.width / DPR;
    const h = canvas.height / DPR;
    ctx.clearRect(0, 0, w, h);
    const grd = ctx.createRadialGradient(w * 0.25, h * 0.4, 0, w * 0.25, h * 0.4, Math.max(w, h) * 0.5);
    grd.addColorStop(0, 'rgba(0,0,0,0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }

  // initial setup
  function start() {
    resizeCanvas();
    createParticles();
    lastTime = performance.now();
    requestAnimationFrame(draw);
  }

  // handle resize
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      createParticles();
    }, 120);
  });

  // small optimization: pause when page/tab not visible
  let visible = true;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) visible = false;
    else {
      visible = true;
      lastTime = performance.now();
      requestAnimationFrame(draw);
    }
  });

  start();
});
