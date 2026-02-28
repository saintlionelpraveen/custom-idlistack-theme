/**
 * IDLISTACK THEME – Animated Background
 * Continuously drifts blob elements for ambient depth
 */

(function () {
    'use strict';

    const blobs = [
        document.getElementById('blur1'),
        document.getElementById('blur2'),
        document.getElementById('blur3'),
    ].filter(Boolean);

    if (!blobs.length) return;

    // Each blob has its own random motion parameters
    const params = blobs.map(function () {
        return {
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            scale: 1 + Math.random() * 0.15,
            dScale: (Math.random() - 0.5) * 0.001,
        };
    });

    const bounds = { x: 80, y: 80 };

    function tick() {
        params.forEach(function (p, i) {
            p.x += p.vx;
            p.y += p.vy;
            p.scale += p.dScale;

            // Bounce
            if (Math.abs(p.x) > bounds.x) { p.vx *= -1; p.x = Math.sign(p.x) * bounds.x; }
            if (Math.abs(p.y) > bounds.y) { p.vy *= -1; p.y = Math.sign(p.y) * bounds.y; }
            if (p.scale > 1.2 || p.scale < 0.85) { p.dScale *= -1; }

            blobs[i].style.transform =
                'translate(' + p.x + 'px, ' + p.y + 'px) scale(' + p.scale + ')';
        });

        requestAnimationFrame(tick);
    }

    // Reduce motion preference
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(tick);
    }

})();