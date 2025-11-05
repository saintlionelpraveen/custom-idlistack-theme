// main.js — small behaviors for the theme
document.addEventListener('DOMContentLoaded', function(){
  // Highlight active nav link
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';

  navLinks.forEach(link => {
    try{
      const href = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
      if(href === currentPath){
        link.classList.add('nav-link--active');
        link.setAttribute('aria-current', 'page');
      }
    }catch(e){/* ignore invalid URLs */}
  });

  // Simple lazy image reveal for hero image
  const heroImg = document.getElementById('hero-featured-image');
  if(heroImg){
    heroImg.addEventListener('load', ()=> heroImg.classList.add('is-loaded'));
  }

  // Progressive enhancement: ensure external links open in new tab
  document.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if(href && href.startsWith('http') && !href.includes(window.location.hostname)){
      a.setAttribute('target','_blank');
      a.setAttribute('rel','noopener noreferrer');
    }
  });
});
