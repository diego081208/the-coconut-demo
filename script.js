/* ==========================================================================
   THE PINK COCONUT — script.js
   Vanilla JS, no dependencies. Progressive enhancement throughout.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     0. CONSTANTS / SHARED CONFIG
     ------------------------------------------------------------------------ */

  var CALL_URL = 'tel:+529988831842';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Small helper: query a single element.
   */
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  /**
   * Small helper: query all elements, returned as a real array.
   */
  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ------------------------------------------------------------------------
     1. HEADER — scroll state (shrink + solid background on scroll)
     ------------------------------------------------------------------------ */

  function initHeaderScroll() {
    var header = qs('#site-header');
    if (!header) return;

    var SCROLL_THRESHOLD = 24;
    var ticking = false;

    function updateHeaderState() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeaderState();
  }

  /* ------------------------------------------------------------------------
     2. MOBILE NAVIGATION — hamburger toggle, focus trap, ESC to close
     ------------------------------------------------------------------------ */

  function initMobileNav() {
    var hamburger = qs('#hamburger');
    var mobileNav = qs('#mobile-nav');
    if (!hamburger || !mobileNav) return;

    var focusableSelector = 'a[href], button:not([disabled])';
    var lastFocusedElement = null;

    function getFocusableElements() {
      return qsa(focusableSelector, mobileNav);
    }

    function openNav() {
      lastFocusedElement = document.activeElement;
      mobileNav.classList.add('is-open');
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Cerrar menú');
      document.body.style.overflow = 'hidden';

      var focusable = getFocusableElements();
      if (focusable.length) {
        focusable[0].focus();
      }

      document.addEventListener('keydown', handleKeydown);
    }

    function closeNav() {
      mobileNav.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Abrir menú');
      document.body.style.overflow = '';

      document.removeEventListener('keydown', handleKeydown);

      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }

    function toggleNav() {
      if (mobileNav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closeNav();
        return;
      }

      if (event.key === 'Tab') {
        var focusable = getFocusableElements();
        if (!focusable.length) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    hamburger.addEventListener('click', toggleNav);

    qsa('.mobile-nav__link, .mobile-nav__cta', mobileNav).forEach(function (link) {
      link.addEventListener('click', function () {
        if (link.classList.contains('mobile-nav__link')) {
          closeNav();
        }
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && mobileNav.classList.contains('is-open')) {
        closeNav();
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. SMOOTH SCROLL — in-page anchor links with header offset
     ------------------------------------------------------------------------ */

  function initSmoothScroll() {
    var header = qs('#site-header');

    qsa('a[href^="#"]').forEach(function (link) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      link.addEventListener('click', function (event) {
        var target = qs(targetId);
        if (!target) return;

        event.preventDefault();

        var headerHeight = header ? header.getBoundingClientRect().height : 0;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ------------------------------------------------------------------------
     4. ACCORDION — accessible expand/collapse for menu sections
     ------------------------------------------------------------------------ */

  function initAccordion() {
    var accordion = qs('#menu-accordion');
    if (!accordion) return;

    var headers = qsa('.accordion__header', accordion);

    function closeAllExcept(exceptButton) {
      headers.forEach(function (button) {
        if (button === exceptButton) return;
        var panel = qs('#' + button.getAttribute('aria-controls'));
        button.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
      });
    }

    headers.forEach(function (button, index) {
      button.addEventListener('click', function () {
        var panelId = button.getAttribute('aria-controls');
        var panel = qs('#' + panelId);
        if (!panel) return;

        var isExpanded = button.getAttribute('aria-expanded') === 'true';

        closeAllExcept(button);

        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
        } else {
          button.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
        }
      });

      button.addEventListener('keydown', function (event) {
        var nextIndex = null;

        if (event.key === 'ArrowDown') {
          nextIndex = (index + 1) % headers.length;
        } else if (event.key === 'ArrowUp') {
          nextIndex = (index - 1 + headers.length) % headers.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = headers.length - 1;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          headers[nextIndex].focus();
        }
      });
    });

    // Open the first panel by default for discoverability.
    if (headers.length) {
      var firstPanel = qs('#' + headers[0].getAttribute('aria-controls'));
      headers[0].setAttribute('aria-expanded', 'true');
      if (firstPanel) firstPanel.hidden = false;
    }
  }

  /* ------------------------------------------------------------------------
     5. GALLERY LIGHTBOX — open, close, keyboard nav, focus trap
     ------------------------------------------------------------------------ */

  function initGalleryLightbox() {
    var lightbox = qs('#lightbox');
    var lightboxImg = qs('#lightbox-img');
    var closeBtn = qs('#lightbox-close');
    var galleryButtons = qsa('.gallery__btn');

    if (!lightbox || !lightboxImg || !closeBtn || !galleryButtons.length) return;

    var currentIndex = 0;
    var lastFocusedElement = null;

    function openLightbox(index) {
      var button = galleryButtons[index];
      if (!button) return;

      currentIndex = index;
      lastFocusedElement = document.activeElement;

      var fullSrc = button.getAttribute('data-full');
      var caption = button.getAttribute('data-caption') || '';

      lightboxImg.setAttribute('src', fullSrc);
      lightboxImg.setAttribute('alt', caption);
      lightbox.setAttribute('aria-hidden', 'false');
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      closeBtn.focus();
      document.addEventListener('keydown', handleKeydown);
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeydown);

      window.setTimeout(function () {
        lightboxImg.setAttribute('src', '');
      }, prefersReducedMotion ? 0 : 400);

      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }

    function showNext(step) {
      var nextIndex = (currentIndex + step + galleryButtons.length) % galleryButtons.length;
      openLightbox(nextIndex);
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        showNext(1);
      } else if (event.key === 'ArrowLeft') {
        showNext(-1);
      } else if (event.key === 'Tab') {
        // Single focusable element inside the lightbox — keep focus locked.
        event.preventDefault();
        closeBtn.focus();
      }
    }

    galleryButtons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        openLightbox(index);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  /* ------------------------------------------------------------------------
     6. SCROLL REVEAL — IntersectionObserver-driven fade/slide-in for
        every [data-reveal] element, with a no-JS / no-IO fallback.
     ------------------------------------------------------------------------ */

  function initScrollReveal() {
    var revealElements = qsa('[data-reveal]');
    if (!revealElements.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12
      }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     7. LAZY LOADING — enhance native loading="lazy" with an
        IntersectionObserver fade-in once each image has actually loaded,
        plus a fallback for browsers without native lazy loading.
     ------------------------------------------------------------------------ */

  function initLazyLoading() {
    var lazyImages = qsa('img[loading="lazy"]');
    if (!lazyImages.length) return;

    function fadeInImage(img) {
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.style.opacity = '0';
        img.style.transition = prefersReducedMotion ? 'none' : 'opacity 0.5s ease-out';
        img.addEventListener('load', function () {
          img.style.opacity = '1';
        });
      }
    }

    var supportsNativeLazy = 'loading' in HTMLImageElement.prototype;

    if (supportsNativeLazy) {
      lazyImages.forEach(fadeInImage);
      return;
    }

    // Fallback for browsers without native lazy loading support.
    if (!('IntersectionObserver' in window)) {
      lazyImages.forEach(function (img) {
        if (img.dataset.src) img.src = img.dataset.src;
      });
      return;
    }

    var imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          fadeInImage(img);
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    lazyImages.forEach(function (img) {
      imgObserver.observe(img);
    });
  }

  /* ------------------------------------------------------------------------
     8. FLOATING STACK — inject back-to-top and call buttons,
        wire up their behavior.
     ------------------------------------------------------------------------ */

  function initFloatingStack() {
    var stack = document.createElement('div');
    stack.className = 'floating-stack';

    var callLink = document.createElement('a');
    callLink.href = CALL_URL;
    callLink.className = 'call-fab';
    callLink.setAttribute('aria-label', 'Llamar al Restaurante');
    callLink.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false">' +
      '<path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.25 1Z"/>' +
      '</svg>';

    var backToTopBtn = document.createElement('button');
    backToTopBtn.type = 'button';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Volver arriba');
    backToTopBtn.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false">' +
      '<path d="M12 19V5M5 12l7-7 7 7"/>' +
      '</svg>';

    stack.appendChild(backToTopBtn);
    stack.appendChild(callLink);
    document.body.appendChild(stack);

    var SHOW_THRESHOLD = 480;
    var ticking = false;

    function updateVisibility() {
      if (window.scrollY > SHOW_THRESHOLD) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    }, { passive: true });

    updateVisibility();

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      qs('.logo').focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------------
     9. ACTIVE NAV LINK — highlight the current section while scrolling
     ------------------------------------------------------------------------ */

  function initActiveNavLink() {
    var sections = qsa('main section[id]');
    var navLinks = qsa('.nav-link, .mobile-nav__link');
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    function setActive(id) {
      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     10. YEAR STAMP — keep footer copyright year current automatically
     ------------------------------------------------------------------------ */

  function initFooterYear() {
    var footerCopy = qs('.footer__copy');
    if (!footerCopy) return;

    var currentYear = new Date().getFullYear();
    footerCopy.innerHTML = footerCopy.innerHTML.replace(/\d{4}/, String(currentYear));
  }

  /* ------------------------------------------------------------------------
     11. INIT — run everything once the DOM is ready
     ------------------------------------------------------------------------ */

  function init() {
    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();
    initAccordion();
    initGalleryLightbox();
    initScrollReveal();
    initLazyLoading();
    initFloatingStack();
    initActiveNavLink();
    initFooterYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
