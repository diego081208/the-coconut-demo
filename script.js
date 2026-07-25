/* ==========================================================================
   THE PINK COCONUT — script.js
   Vanilla JS, no dependencies. Progressive enhancement throughout.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     0. CONSTANTS / SHARED CONFIG
     ------------------------------------------------------------------------ */

  var WHATSAPP_NUMBER = '529988831842';
  var WHATSAPP_MESSAGE = 'Hola%2C%20me%20gustar%C3%ADa%20reservar%20una%20mesa%20en%20The%20Pink%20Coconut.';
  var WHATSAPP_URL = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + WHATSAPP_MESSAGE;

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
     8. FLOATING STACK — inject back-to-top and WhatsApp call buttons,
        wire up their behavior.
     ------------------------------------------------------------------------ */

  function initFloatingStack() {
    var stack = document.createElement('div');
    stack.className = 'floating-stack';

    var whatsappLink = document.createElement('a');
    whatsappLink.href = WHATSAPP_URL;
    whatsappLink.className = 'whatsapp-fab';
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener';
    whatsappLink.setAttribute('aria-label', 'Escríbenos por WhatsApp');
    whatsappLink.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
      '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.13-2.9-7C17.18 3.03 14.7 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.27-8.24 2.21 0 4.28.86 5.84 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.27 8.24Zm4.52-6.16c-.25-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.96-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.51.59.19 1.12.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/>' +
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
    stack.appendChild(whatsappLink);
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
