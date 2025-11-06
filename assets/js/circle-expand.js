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
      angle: (2 * Math.PI * index) / profileCount
    }));

    // Calculate dynamic sizes based on profile count
    const baseSize = 96; // Base profile image size
    const minSize = 64; // Minimum size for many images
    const maxProfiles = 12; // After this, start reducing size
    
    // Calculate profile size (smaller if more images)
    const profileSize = profileCount > maxProfiles 
      ? Math.max(minSize, baseSize - ((profileCount - maxProfiles) * 2))
      : baseSize;

    // Calculate expand radius based on profile count and size
    const baseRadius = 300;
    const radiusIncrement = Math.max(0, (profileCount - 6) * 15);
    const maxExpandRadius = baseRadius + radiusIncrement;

    // Apply dynamic sizing to profile images
    profileElements.forEach(element => {
      element.style.width = `${profileSize}px`;
      element.style.height = `${profileSize}px`;
    });

    // Adjust circle sizes based on profile count
    const innerCircleSize = 400 + (profileCount > 8 ? (profileCount - 8) * 20 : 0);
    const middleCircleSize = innerCircleSize + 100;
    const outerCircleSize = middleCircleSize + 100;

    const gradientRing = document.querySelector('.gradient-ring');
    const innerCircle = document.querySelector('.inner-circle');

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

    function handleScroll() {
      const rect = galleryContainer.getBoundingClientRect();
      const galleryTop = rect.top;
      const windowHeight = window.innerHeight;
      
      const scrollProgress = Math.max(0, -galleryTop);
      const animationProgress = Math.min(scrollProgress / 500, 1);
      const expandRadius = animationProgress * maxExpandRadius;

      if (galleryTop < windowHeight && galleryTop > -rect.height) {
        profiles.forEach(profile => {
          if (profile.element) {
            const x = expandRadius * Math.cos(profile.angle);
            const y = expandRadius * Math.sin(profile.angle);
            profile.element.style.transform = `translate(${x}px, ${y}px)`;
          }
        });

        if (scrollProgress > 100) {
          middleCircle.classList.add('show-border');
        } else {
          middleCircle.classList.remove('show-border');
        }

        if (scrollProgress > 250) {
          content.classList.add('visible');
        } else {
          content.classList.remove('visible');
        }

        if (scrollProgress > 300) {
          outerCircle.classList.add('show-border');
        } else {
          outerCircle.classList.remove('show-border');
        }
      }
    }

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCircleGallery);
  } else {
    initCircleGallery();
  }
})();