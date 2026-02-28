/**
 * IDLISTACK THEME – Main JS
 * Handles: scroll-reveal, counter animations, smooth init
 */

(function () {
  'use strict';

  // ── Scroll Reveal ──────────────────────────────────────
  function initReveal() {
    const elements = document.querySelectorAll('.reveal, .why-stacks-section');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });

    // Also observe dynamically created story-cards (early stackers)
    const storyObserver = new MutationObserver(function () {
      const storyCards = document.querySelectorAll('.story-card:not(.observed)');
      storyCards.forEach(function (card, i) {
        card.classList.add('observed');
        card.style.transitionDelay = (i * 0.1) + 's';
        observer.observe(card);
      });
    });
    storyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ── Counter Animation ──────────────────────────────────
  function animateCounter(el, target, suffix) {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);

      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || '';
            animateCounter(el, target, suffix);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  // ── Lazy Load Images ───────────────────────────────────
  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // native support

    const images = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          observer.unobserve(img);
        }
      });
    });
    images.forEach(function (img) { observer.observe(img); });
  }

  // ── Post Card Stagger ──────────────────────────────────
  function initCardStagger() {
    const cards = document.querySelectorAll('.post-card.reveal');
    cards.forEach(function (card, i) {
      card.style.transitionDelay = (i * 0.07) + 's';
    });
  }

  // ── Init ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initCounters();
    initLazyLoad();
    initCardStagger();
  });

})();
