// assets/js/circle-gallery.js
(function() {
  function initCircleGallery() {
    const galleryContainer = document.querySelector('.embedded-gallery');
    const outerCircle = document.getElementById('outerCircle');
    const middleCircle = document.getElementById('middleCircle');
    const content = document.getElementById('content');

    if (!galleryContainer || !outerCircle || !middleCircle || !content) {
      return;
    }

    // Dynamically get all profile images
    const profileElements = document.querySelectorAll('.profile-image');
    const profileCount = profileElements.length;

    // Generate angles based on the number of profiles
    const profiles = Array.from(profileElements).map((element, index) => ({
      id: element.id,
      element: element,
      baseAngle: (2 * Math.PI * index) / profileCount
    }));

    // Calculate dynamic sizes based on profile count
    const baseSize = 80;
    const minSize = 64;
    const maxProfiles = 12;
    
    const profileSize = profileCount > maxProfiles 
      ? Math.max(minSize, baseSize - ((profileCount - maxProfiles) * 2))
      : baseSize;

    // Calculate orbit radius based on profile count and viewport
    function getOrbitRadius() {
      const baseRadius = window.innerWidth <= 560 ? 130 : 
                        window.innerWidth <= 860 ? 170 : 250;
      const radiusIncrement = Math.max(0, (profileCount - 6) * (window.innerWidth <= 560 ? 8 : 15));
      return baseRadius + radiusIncrement;
    }

    let orbitRadius = getOrbitRadius();

    // Apply dynamic sizing to profile images
    profileElements.forEach(element => {
      element.style.width = `${profileSize}px`;
      element.style.height = `${profileSize}px`;
      element.style.transition = 'transform 0.05s linear';
    });

    // Adjust circle sizes based on profile count and viewport
    function updateCircleSizes() {
      const isMobile = window.innerWidth <= 560;
      const isTablet = window.innerWidth <= 860;
      
      let innerCircleSize, middleCircleSize, outerCircleSize;
      
      if (isMobile) {
        innerCircleSize = 250 + (profileCount > 8 ? (profileCount - 8) * 10 : 0);
      } else if (isTablet) {
        innerCircleSize = 340 + (profileCount > 8 ? (profileCount - 8) * 15 : 0);
      } else {
        innerCircleSize = 400 + (profileCount > 8 ? (profileCount - 8) * 20 : 0);
      }
      
      middleCircleSize = innerCircleSize + (isMobile ? 70 : 90);
      outerCircleSize = middleCircleSize + (isMobile ? 80 : 100);

      const gradientRing = document.querySelector('.gradient-ring');

      if (gradientRing) {
        gradientRing.style.width = `${innerCircleSize}px`;
        gradientRing.style.height = `${innerCircleSize}px`;
      }

      if (middleCircle) {
        middleCircle.style.width = `${middleCircleSize}px`;
        middleCircle.style.height = `${middleCircleSize}px`;
      }

      if (outerCircle) {
        outerCircle.style.width = `${outerCircleSize}px`;
        outerCircle.style.height = `${outerCircleSize}px`;
      }
    }

    updateCircleSizes();

    // Continuous rotation animation - always running
    let rotationAngle = 0;

    function animate() {
      rotationAngle += 0.008; // Smooth rotation speed
      
      profiles.forEach(profile => {
        if (profile.element) {
          const currentAngle = profile.baseAngle + rotationAngle;
          const x = orbitRadius * Math.cos(currentAngle);
          const y = orbitRadius * Math.sin(currentAngle);
          profile.element.style.transform = `translate(${x}px, ${y}px)`;
        }
      });

      requestAnimationFrame(animate);
    }

    // Show all elements immediately
    middleCircle.classList.add('show-border');
    outerCircle.classList.add('show-border');
    content.classList.add('visible');

    // Start continuous rotation
    animate();

    // Handle resize
    function handleResize() {
      orbitRadius = getOrbitRadius();
      updateCircleSizes();
    }

    window.addEventListener('resize', handleResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCircleGallery);
  } else {
    initCircleGallery();
  }
})();