// navigation.js — mobile nav toggle
document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if(!toggle || !nav) return;

  toggle.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));

    if(!expanded){
      nav.style.display = 'flex';
      nav.style.flexDirection = 'column';
      nav.style.gap = '12px';
    }else{
      nav.style.display = '';
    }
  });
});
document.querySelector('.btn-join')?.addEventListener('click', (e) => {
  if (window.location.pathname === '/join') return;
  e.preventDefault();
  document.querySelector('#posts-section')?.scrollIntoView({ behavior: 'smooth' });
});