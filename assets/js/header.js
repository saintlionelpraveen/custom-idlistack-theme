/**
 * IDLISTACK THEME – Header Controller
 * Handles: sticky scroll, mobile menu, active nav link
 */

(function () {
    'use strict';

    const header = document.getElementById('siteHeader');
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileDrawer = document.getElementById('mobileNavDrawer');

    // ── Sticky Header ─────────────────────────────────────
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    function updateHeader() {
        const currentY = window.scrollY;

        if (currentY > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollY = currentY;
        ticking = false;
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Mobile Menu ────────────────────────────────────────
    function openMenu() {
        mobileDrawer.classList.add('open');
        mobileToggle.classList.add('open');
        mobileToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        mobileDrawer.classList.remove('open');
        mobileToggle.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            if (mobileDrawer.classList.contains('open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }

    // Close drawer on overlay click
    if (mobileDrawer) {
        mobileDrawer.addEventListener('click', function (e) {
            if (e.target === mobileDrawer) closeMenu();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });

    // ── Active Nav Link ────────────────────────────────────
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-container a, .mobile-nav-drawer a');

    navLinks.forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('nav-active');
        }
    });

})();