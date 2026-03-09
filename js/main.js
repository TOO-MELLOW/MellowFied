/* ============================================
   MELLOW TECH SERVICES — MAIN.JS
   Handles: nav scroll, mobile menu, counter animation,
   scroll reveal, FAQ accordion, service filter,
   contact form, URL param pre-select
   ============================================ */

(function () {
  'use strict';

  /* ---------- NAV SCROLL ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ---------- MOBILE MENU ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- COUNTER ANIMATION ---------- */
  const counters = document.querySelectorAll('.stat-num');

  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }

    requestAnimationFrame(update);
  }

  /* ---------- FAQ ACCORDION ---------- */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (btn) {
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close all
        faqItems.forEach(i => i.classList.remove('open'));
        // Toggle current
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  /* ---------- SERVICE FILTER TABS ---------- */
  const tabs = document.querySelectorAll('.tab');
  const cards = document.querySelectorAll('.full-service-card');

  if (tabs.length && cards.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');

        cards.forEach(card => {
          const cat = card.getAttribute('data-cat');
          const show = filter === 'all' || cat === filter;
          card.classList.toggle('hidden', !show);

          if (show) {
            // Re-trigger reveal animation
            card.classList.remove('visible');
            setTimeout(() => card.classList.add('visible'), 50);
          }
        });
      });
    });

    // Trigger visible for all on load
    setTimeout(() => {
      cards.forEach(c => c.classList.add('visible'));
    }, 300);
  }

  /* ---------- CONTACT FORM ---------- */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    // Pre-select service from URL param
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    if (serviceParam) {
      const serviceSelect = document.getElementById('service');
      if (serviceSelect) {
        const option = serviceSelect.querySelector(`option[value="${serviceParam}"]`);
        if (option) serviceSelect.value = serviceParam;
      }
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const required = contactForm.querySelectorAll('[required]');
      let valid = true;

      required.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          valid = false;
        }
      });

      if (!valid) return;

      // Simulate submission
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');

      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';

      // Build WhatsApp message from form data
      const name = document.getElementById('name')?.value || '';
      const phone = document.getElementById('phone')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const service = document.getElementById('service')?.value || '';
      const message = document.getElementById('message')?.value || '';

      const waMsg = `Hi Mellow Tech! 👋%0A%0A*New Inquiry from Website*%0A%0A*Name:* ${encodeURIComponent(name)}%0A*Phone:* ${encodeURIComponent(phone)}%0A*Email:* ${encodeURIComponent(email)}%0A*Service:* ${encodeURIComponent(service)}%0A%0A*Message:*%0A${encodeURIComponent(message)}`;

      setTimeout(() => {
        contactForm.style.display = 'none';
        if (formSuccess) formSuccess.style.display = 'block';

        // Update WA link in success block
        const waBtn = formSuccess.querySelector('.btn-wa');
        if (waBtn) {
          waBtn.href = `https://wa.me/27720465993?text=${waMsg}`;
        }
      }, 1200);
    });

    // Remove error highlight on input
    contactForm.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
    });
  }

  /* ---------- SMOOTH ANCHOR SCROLL ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- ACTIVE NAV LINK ---------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---------- PARALLAX HERO ORBS (subtle) ---------- */
  const orbs = document.querySelectorAll('.hero-orb');
  if (orbs.length) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      orbs.forEach((orb, i) => {
        const factor = i % 2 === 0 ? 1 : -0.6;
        orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
      });
    }, { passive: true });
  }

})();
// ========== NAVBAR HIDE ON SCROLL DOWN - SHOW ON SCROLL UP ==========
const nav = document.getElementById('nav');
let lastScroll = 0;

function handleNavbarScroll() {
    const currentScroll = window.scrollY;
    
    // Add/remove scrolled class for background (YOUR EXISTING EFFECT)
    if (currentScroll > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    
    // Hide/show navbar based on scroll direction
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling DOWN - hide navbar
        nav.classList.add('nav-hidden');
    } else {
        // Scrolling UP - show navbar
        nav.classList.remove('nav-hidden');
    }
    
    lastScroll = currentScroll;
}

// Add scroll event listener
window.addEventListener('scroll', handleNavbarScroll);

// Run once on page load
handleNavbarScroll();
