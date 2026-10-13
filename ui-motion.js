(function () {
  'use strict';

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;

  // Reveal selected content as it enters view; content stays visible if unsupported.
  function setupReveal() {
    var selector = 'section, article, [class*="room-card"], [class*="branch-card"], ' +
      '[class*="service-card"], [class*="feature-card"], [class*="gallery-item"], [class*="card"]';
    var elements = Array.prototype.slice.call(document.querySelectorAll(selector))
      .filter(function (element) {
        if (element.closest('header, nav, footer, [hidden], [aria-hidden="true"]')) return false;
        var rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .slice(0, 180);

    if (!elements.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

    elements.forEach(function (element, index) {
      element.classList.add('hotel-motion-reveal');
      element.style.setProperty('--hotel-motion-delay', (index % 5) * 55 + 'ms');
      observer.observe(element);
    });

    // Keep above-the-fold content from waiting for an intersection callback.
    requestAnimationFrame(function () {
      elements.forEach(function (element) {
        if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
          element.classList.add('is-visible');
        }
      });
    });
  }

  function setupScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'hotel-motion-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var scheduled = false;
    function update() {
      var root = document.documentElement;
      var max = root.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = progress + '%';
      scheduled = false;
    }
    function onScroll() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function init() {
    doc.classList.add('hotel-motion-enhanced');
    setupReveal();
    if (!reducedMotion && document.body) setupScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
