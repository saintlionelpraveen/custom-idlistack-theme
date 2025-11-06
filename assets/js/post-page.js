/**
 * Post Page Scroll Progress Bar
 * Updates the progress bar based on scroll position.
 */
window.addEventListener('scroll', () => {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) return;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (scrollTop / scrollHeight) * 100;
  progressBar.style.width = `${scrolled}%`;
});

/**
 * Background Hover Effect (Pink Smoky Glow)
 * Creates a glowing effect on the black background that follows the mouse
 * but disappears when hovering over the white post container.
 */
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const postCardWrapper = document.querySelector('.post-card-wrapper');
  
  if (!body || !postCardWrapper) return;
  
  let isHoveringCard = false;
  
  // Track mouse movement on the entire page
  document.addEventListener('mousemove', (e) => {
    // Update CSS variables for mouse position
    body.style.setProperty('--mouse-x', `${e.clientX}px`);
    body.style.setProperty('--mouse-y', `${e.clientY}px`);
    
    // Show background glow only when NOT hovering over the card
    if (!isHoveringCard) {
      body.classList.add('bg-hover');
    }
  });
  
  // Detect when mouse enters the post card
  postCardWrapper.addEventListener('mouseenter', () => {
    isHoveringCard = true;
    body.classList.remove('bg-hover');
  });
  
  // Detect when mouse leaves the post card
  postCardWrapper.addEventListener('mouseleave', () => {
    isHoveringCard = false;
    body.classList.add('bg-hover');
  });
  
  // Hide glow when mouse leaves the window
  document.addEventListener('mouseleave', () => {
    body.classList.remove('bg-hover');
  });
});