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


  // Compact the navigation after leaving the hero's first few pixels.
  function setupHeaderState() {
    var header = document.getElementById('main-header');
    if (!header) return;
    var scheduled = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 28);
      scheduled = false;
    }
    function onScroll() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  // A very subtle pointer-following light on the hero; no 3D transform is applied.
  function setupHeroSpotlight() {
    if (reducedMotion || !window.matchMedia ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var hero = document.querySelector('.hero-container');
    if (!hero) return;
    var rect = null;
    hero.addEventListener('pointermove', function (event) {
      rect = hero.getBoundingClientRect();
      var x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      var y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      hero.style.setProperty('--hero-pointer-x', x.toFixed(1) + '%');
      hero.style.setProperty('--hero-pointer-y', y.toFixed(1) + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--hero-pointer-x', '50%');
      hero.style.setProperty('--hero-pointer-y', '42%');
    }, { passive: true });
  }

  // Track pointer position for the soft gold lighting on room and amenity cards.
  function setupCardSpotlights() {
    if (reducedMotion || !window.matchMedia ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var selector = '#accommodations .responsive-card-grid > div, ' +
      '#amenities .grid > div, #dining-banquets .grid > div';
    document.querySelectorAll(selector).forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
        var y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
        card.style.setProperty('--card-x', x.toFixed(1) + '%');
        card.style.setProperty('--card-y', y.toFixed(1) + '%');
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--card-x', '50%');
        card.style.setProperty('--card-y', '50%');
      }, { passive: true });
    });
  }

  // Give the desktop nav a restrained active-section marker.
  function setupActiveNavigation() {
    if (!('IntersectionObserver' in window)) return;
    var anchors = Array.prototype.slice.call(
      document.querySelectorAll('#navbar-bar a[href^="#"]')
    ).filter(function (anchor) {
      var href = anchor.getAttribute('href');
      return href && href.length > 1 && document.getElementById(href.slice(1));
    });
    if (!anchors.length) return;

    var sections = anchors.map(function (anchor) {
      return document.getElementById(anchor.getAttribute('href').slice(1));
    }).filter(function (section, index, list) {
      return section && list.indexOf(section) === index;
    });
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) {
        return Math.abs(a.boundingClientRect.top - window.innerHeight * 0.36) -
          Math.abs(b.boundingClientRect.top - window.innerHeight * 0.36);
      });
      var activeId = visible[0].target.id;
      anchors.forEach(function (anchor) {
        anchor.classList.toggle('is-current-section',
          anchor.getAttribute('href') === '#' + activeId);
      });
    }, { rootMargin: '-18% 0px -62% 0px', threshold: 0 });
    sections.forEach(function (section) { observer.observe(section); });
  }

  function init() {
    doc.classList.add('hotel-motion-enhanced');
    setupReveal();
    setupHeaderState();
    setupActiveNavigation();
    setupHeroSpotlight();
    setupCardSpotlights();
    if (!reducedMotion && document.body) setupScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
