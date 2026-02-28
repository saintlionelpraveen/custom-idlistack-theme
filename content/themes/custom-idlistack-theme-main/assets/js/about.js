document.addEventListener("DOMContentLoaded", () => {
  /* ── Reveal on scroll ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(
    ".fade-in, .fade-stagger, .scale-in, .anim-slide-left, .anim-zoom-in, .anim-reveal-up, .anim-stagger-images, .anim-glow-rise, .anim-slide-right, .anim-bounce-in"
  ).forEach(el => revealObserver.observe(el));

  /* ── Extract images from hidden source and populate collage ── */
  const sources = document.querySelectorAll(".about-image-source");
  if (sources.length > 0) {
    // Collect all images across all source containers in order
    const allImgs = [];
    sources.forEach(src => {
      src.querySelectorAll("img").forEach(img => allImgs.push(img));
    });

    allImgs.forEach((img, i) => {
      // First 4 go into collage grid
      const collageSlot = document.querySelector(`.collage-item[data-slot="${i + 1}"]`);
      if (collageSlot) {
        collageSlot.innerHTML = "";
        const clone = img.cloneNode(true);
        clone.style.width = "100%";
        clone.style.height = "100%";
        clone.style.objectFit = "cover";
        clone.style.display = "block";
        collageSlot.appendChild(clone);
      }

      // 5th goes to black box icon
      if (i === 4) {
        const iconTarget = document.querySelector('.icon-slot[data-slot="5"]');
        if (iconTarget) {
          iconTarget.innerHTML = "";
          const clone = img.cloneNode(true);
          iconTarget.appendChild(clone);
        }
      }

      // 6th goes to pink box graphic
      if (i === 5) {
        const graphicTarget = document.querySelector('.icon-slot[data-slot="6"]');
        if (graphicTarget) {
          graphicTarget.innerHTML = "";
          const clone = img.cloneNode(true);
          graphicTarget.appendChild(clone);
        }
      }
    });

    // Remove hidden sources after extraction
    sources.forEach(src => src.remove());
  }

  /* ── Stat counter (kept from original) ── */
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