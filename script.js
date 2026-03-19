/* ============================================
   EDITORIAL GRADUATION PHOTOGRAPHY — SCRIPTS
   ============================================ */

(function () {
  'use strict';

  // --- HEADER SCROLL EFFECT ---
  const header = document.getElementById('header');
  let lastScroll = 0;

  function handleHeaderScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }

  // --- MOBILE STICKY CTA ---
  const mobileCta = document.getElementById('mobileCta');

  function handleMobileCta() {
    if (!mobileCta) return;
    const scrollY = window.scrollY;
    const heroHeight = document.getElementById('hero')?.offsetHeight || 600;

    if (scrollY > heroHeight * 0.7) {
      mobileCta.classList.add('visible');
    } else {
      mobileCta.classList.remove('visible');
    }
  }

  // --- SCROLL REVEAL ANIMATIONS ---
  function initScrollReveal() {
    const revealElements = document.querySelectorAll(
      '.portfolio-item, .pricing-card, .process-step, .diff-content, .diff-image-wrapper, .addons, .section-header'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger animation for grid children
            const parent = entry.target.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll('.reveal'));
              const index = siblings.indexOf(entry.target);
              entry.target.style.transitionDelay = `${index * 0.08}s`;
            }
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    revealElements.forEach(el => observer.observe(el));
  }

  // --- SMOOTH SCROLL FOR ANCHOR LINKS ---
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // --- PASSIVE SCROLL HANDLER ---
  function onScroll() {
    handleHeaderScroll();
    handleMobileCta();
  }

  // --- INIT ---
  function init() {
    initSmoothScroll();
    initScrollReveal();

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial state
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
