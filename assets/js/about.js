document.addEventListener("DOMContentLoaded", () => {
  /* Reveal on scroll */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible"); });
  }, { threshold: 0.15 });
  document.querySelectorAll(".fade-in, .fade-stagger, .scale-in").forEach(el => revealObserver.observe(el));

  /* Mouse parallax */
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener("mousemove", e => {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });
  (function loop(){
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    document.querySelectorAll(".parallax-layer").forEach(layer => {
      const s = parseFloat(layer.dataset.speed || 0.4);
      layer.style.transform = `translate3d(${cx * 40 * s}px, ${cy * 40 * s}px, 0)`;
    });
    requestAnimationFrame(loop);
  })();

  /* Tilt */
  document.querySelectorAll(".feature, .value-item, .card, .stat, .hero-img, .intro-row img").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = (y / r.height - 0.5) * -10;
      const ry = (x / r.width - 0.5) * 10;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(16px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  /* Stat counter */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.done) return;
      const raw = el.textContent;
      const plus = raw.includes("+"), perc = raw.includes("%");
      const goal = parseInt(raw.replace(/\D/g, ""), 10) || 0;
      let n = 0, step = goal / 50;
      const tick = () => {
        n += step;
        if (n >= goal) { n = goal; }
        el.textContent = Math.floor(n) + (plus ? "+" : "") + (perc ? "%" : "");
        if (n < goal) requestAnimationFrame(tick); else el.dataset.done = "1";
      };
      tick();
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-number").forEach(n => counterObs.observe(n));
});