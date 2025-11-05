// Header Navigation Script
(function() {
    'use strict';

    const navBar = document.getElementById('navBar');
    const lampIndicator = document.getElementById('lampIndicator');
    
    if (!navBar || !lampIndicator) return;

    const navLinks = navBar.querySelectorAll('.nav-container a');
    const currentPath = window.location.pathname;

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

        if (activeLink) {
            updateLampPosition(activeLink);
        }
    }

    // Update lamp indicator position
    function updateLampPosition(element) {
        const container = element.closest('.nav-container');
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const left = rect.left - containerRect.left;
        const width = rect.width;

        lampIndicator.style.transform = `translateX(${left}px)`;
        lampIndicator.style.width = `${width}px`;
        lampIndicator.classList.add('active');
    }

    // Handle click events
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('nav-active'));
            
            // Add active class to clicked link
            this.classList.add('nav-active');
            
            // Update lamp position
            updateLampPosition(this);
        });

        // Handle hover effect
        link.addEventListener('mouseenter', function() {
            updateLampPosition(this);
        });
    });

    // Reset lamp to active item on mouse leave
    navBar.addEventListener('mouseleave', function() {
        const activeLink = navBar.querySelector('.nav-active');
        if (activeLink) {
            updateLampPosition(activeLink);
        }
    });

    // Mobile detection and handling
    let isMobile = window.innerWidth < 768;

    function handleResize() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth < 768;

        if (wasMobile !== isMobile) {
            const activeLink = navBar.querySelector('.nav-active');
            if (activeLink) {
                updateLampPosition(activeLink);
            }
        }
    }

    window.addEventListener('resize', handleResize);

    // Initialize on load
    setActiveNav();

})();