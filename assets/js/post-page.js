(function () {
  // Admin blocks you will paste into Ghost:
  // .post-left-1  -> left column (under image/title)
  // .post-left-2  -> left column (under block 1)
  // .post-right-3 -> right column main content
  // .post-cta-4   -> CTA under right content

  function move(el, into) { if (el && into) into.appendChild(el); }

  function createCTAFromText(text, href) {
    const wrap = document.createElement('div');
    wrap.className = 'post-cta-wrap';
    const a = document.createElement('a');
    a.className = 'post-cta-button';
    a.href = href || '#';
    a.textContent = text || 'Learn more';
    wrap.appendChild(a);
    return wrap;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const raw = document.getElementById('ghost-raw-content');
    const leftExtra = document.getElementById('left-extra');
    const rightContent = document.getElementById('right-content');
    const rightCta = document.getElementById('right-cta');

    if (!raw) return;

    const scratch = document.createElement('div');
    scratch.innerHTML = raw.innerHTML || '';

    const b1 = scratch.querySelector('.post-left-1');
    const b2 = scratch.querySelector('.post-left-2');
    const b3 = scratch.querySelector('.post-right-3');
    const b4 = scratch.querySelector('.post-cta-4');

    const hasAny =
      (b1 && b1.innerHTML.trim()) ||
      (b2 && b2.innerHTML.trim()) ||
      (b3 && b3.innerHTML.trim()) ||
      (b4 && b4.innerHTML.trim());

    if (!hasAny) {
      // Fallback: render the entire post on the right
      rightContent.innerHTML = scratch.innerHTML;
      raw.remove();
      return;
    }

    move(b1, leftExtra);
    move(b2, leftExtra);
    move(b3, rightContent);

    if (b4) {
      const hasBtn = b4.querySelector('a');
      if (hasBtn) {
        const wrap = document.createElement('div');
        wrap.className = 'post-cta-wrap';
        wrap.appendChild(b4);
        rightCta.appendChild(wrap);
      } else {
        const text = b4.textContent.trim();
        rightCta.appendChild(createCTAFromText(text || 'Read more'));
      }
    }

    raw.remove();
  });
})();
