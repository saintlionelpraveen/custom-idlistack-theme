(function() {
  const profiles = [
    { id: 'profile1', angle: 0 },
    { id: 'profile2', angle: Math.PI / 4 },
    { id: 'profile3', angle: Math.PI / 2 },
    { id: 'profile4', angle: (3 * Math.PI) / 4 },
    { id: 'profile5', angle: Math.PI },
    { id: 'profile6', angle: (5 * Math.PI) / 4 },
    { id: 'profile7', angle: (3 * Math.PI) / 2 },
    { id: 'profile8', angle: (7 * Math.PI) / 4 }
  ];

  function initCircleGallery() {
    const galleryContainer = document.querySelector('.embedded-gallery');
    const outerCircle = document.getElementById('outerCircle');
    const middleCircle = document.getElementById('middleCircle');
    const content = document.getElementById('content');

    if (!galleryContainer || !outerCircle || !middleCircle || !content) {
      return;
    }

    function handleScroll() {
      // Get the position of the gallery relative to viewport
      const rect = galleryContainer.getBoundingClientRect();
      const galleryTop = rect.top;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress relative to when gallery is in view
      // Negative galleryTop means gallery has scrolled up past viewport top
      const scrollProgress = Math.max(0, -galleryTop);
      const animationProgress = Math.min(scrollProgress / 500, 1);
      const expandRadius = animationProgress * 300;

      // Only animate when gallery is in viewport
      if (galleryTop < windowHeight && galleryTop > -rect.height) {
        profiles.forEach(profile => {
          const element = document.getElementById(profile.id);
          if (element) {
            const x = expandRadius * Math.cos(profile.angle);
            const y = expandRadius * Math.sin(profile.angle);
            element.style.transform = `translate(${x}px, ${y}px)`;
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCircleGallery);
  } else {
    initCircleGallery();
  }
})();