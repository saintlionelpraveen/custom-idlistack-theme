/**
 * IDLISTACK THEME – Navigation JS
 * Lamp indicator follows hovered nav item
 */

(function () {
  'use strict';

  const navContainer = document.querySelector('.nav-container');
  const lamp = document.getElementById('lampIndicator');

  if (!navContainer || !lamp) return;

  const links = navContainer.querySelectorAll('a');

  function moveLamp(el) {
    const containerRect = navContainer.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const left = elRect.left - containerRect.left;
    const width = elRect.width;

    lamp.style.left = left + 'px';
    lamp.style.width = width + 'px';
    lamp.classList.add('active');
  }

  function resetLamp() {
    // Snap back to active link
    const activeLink = navContainer.querySelector('a.nav-active, li.current a');
    if (activeLink) {
      moveLamp(activeLink);
    } else {
      lamp.classList.remove('active');
    }
  }

  links.forEach(function (link) {
    link.addEventListener('mouseenter', function () { moveLamp(link); });
  });

  navContainer.addEventListener('mouseleave', resetLamp);

  // Init on load
  resetLamp();

})();