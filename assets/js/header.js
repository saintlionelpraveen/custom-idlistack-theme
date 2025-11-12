// Header Navigation Script with Smooth Transitions
(function() {
    'use strict';

    const navBar = document.getElementById('navBar');
    const lampIndicator = document.getElementById('lampIndicator');
    
    if (!navBar) return;

    const navLinks = navBar.querySelectorAll('.nav-container a');
    const currentPath = window.location.pathname;

    // Check if mobile
    function isMobile() {
        return window.innerWidth < 768;
    }

    // Set active state based on current URL
    function setActiveNav() {
        let activeLink = null;

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            link.classList.remove('nav-active');

            // Check if current path matches
            if (linkPath === currentPath || 
                (linkPath !== '/' && currentPath.startsWith(linkPath))) {
                activeLink = link;
                link.classList.add('nav-active');
            }
        });

        // Default to first link if no match
        if (!activeLink && navLinks.length > 0) {
            activeLink = navLinks[0];
            activeLink.classList.add('nav-active');
        }

        if (activeLink && lampIndicator && !isMobile()) {
            updateLampPosition(activeLink);
        }
    }

    // Update lamp indicator position (only on desktop)
    function updateLampPosition(element) {
        if (!lampIndicator || isMobile()) return;

        const container = element.closest('.nav-container');
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const left = rect.left - containerRect.left;
        const width = rect.width;

        lampIndicator.style.transform = `translateX(${left}px)`;
        lampIndicator.style.width = `${width}px`;
        lampIndicator.classList.add('active');
    }

    // Handle click events with smooth transition
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('nav-active'));
            
            // Add active class to clicked link
            this.classList.add('nav-active');
            
            // Update lamp position (desktop only)
            if (!isMobile()) {
                updateLampPosition(this);
            }

            // Optional: Add page transition effect
            // Uncomment if you want fade transition between pages
            /*
            e.preventDefault();
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = this.href;
            }, 200);
            */
        });

        // Handle hover effect (desktop only)
        link.addEventListener('mouseenter', function() {
            if (!isMobile()) {
                updateLampPosition(this);
            }
        });
    });

    // Reset lamp to active item on mouse leave (desktop only)
    if (navBar) {
        navBar.addEventListener('mouseleave', function() {
            if (isMobile()) return;
            
            const activeLink = navBar.querySelector('.nav-active');
            if (activeLink && lampIndicator) {
                updateLampPosition(activeLink);
            }
        });
    }

    // Handle resize with debounce for performance
    let resizeTimer;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const activeLink = navBar.querySelector('.nav-active');
            if (activeLink && lampIndicator && !isMobile()) {
                updateLampPosition(activeLink);
            } else if (lampIndicator && isMobile()) {
                // Hide lamp on mobile
                lampIndicator.style.opacity = '0';
            }
        }, 100);
    }

    window.addEventListener('resize', handleResize);

    // Initialize on load
    document.addEventListener('DOMContentLoaded', function() {
        setActiveNav();
        
        // Fade in page on load
        document.body.style.opacity = '1';
    });

    // Also run immediately in case DOM is already loaded
    setActiveNav();

    // Page visibility: smooth transition when returning to page
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setActiveNav();
        }
    });

})();

// Optional: Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';