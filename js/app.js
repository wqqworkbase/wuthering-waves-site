/**
 * Wuthering Waves Hub — Main JavaScript
 * Handles: Lenis smooth scroll, Hero slide transitions,
 *          Scroll-driven reveals, Countdown timers,
 *          Filters, Mobile nav, Page transitions
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  //  Lenis Smooth Scroll
  // ─────────────────────────────────────────────
  async function initLenis() {
    try {
      const Lenis = (await import('https://unpkg.com/lenis@1.1.13/dist/lenis.mjs')).default;
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      window.lenis = lenis;
    } catch (e) {
      // Lenis failed — native scroll works fine as fallback
      console.warn('Lenis init failed, using native scroll:', e.message);
    }
  }

  // ─────────────────────────────────────────────
  //  Scroll Progress Bar
  // ─────────────────────────────────────────────
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.style.width = '0%';
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  // ─────────────────────────────────────────────
  //  Hero Slideshow (Ken Burns + Crossfade)
  // ─────────────────────────────────────────────
  function initHeroSlides() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    // Real image slides from Pexels (anime/cyberpunk aesthetic)
    const WALLPAPERS = [
      { src: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1920' },
      { src: 'https://images.pexels.com/photos/1629789/pexels-photo-1629789.jpeg?auto=compress&cs=tinysrgb&w=1920' },
      { src: 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=1920' },
      { src: 'https://images.pexels.com/photos/2387125/pexels-photo-2387125.jpeg?auto=compress&cs=tinysrgb&w=1920' },
      { src: 'https://images.pexels.com/photos/1534590/pexels-photo-1534590.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    ];

    slides.forEach((slide, i) => {
      const wp = WALLPAPERS[i % WALLPAPERS.length];
      if (wp) {
        slide.style.backgroundImage = `url(${wp.src})`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
      }
    });

    let current = 0;
    slides[current].classList.add('active');

    // Add star particles to the active slide
    const activeSlide = slides[current];
    const starCanvas = document.createElement('canvas');
    starCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    activeSlide.appendChild(starCanvas);
    drawStars(starCanvas);

    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  }

  function drawStars(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5,
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const o = s.opacity * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${o})`;
        ctx.fill();
      });
      frame++;
      requestAnimationFrame(tick);
    }
    tick();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // ─────────────────────────────────────────────
  //  Scroll-Reveal (Intersection Observer)
  // ─────────────────────────────────────────────
  function initScrollReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.revealDelay || 0;
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)`;
      io.observe(el);
    });
  }

  // ─────────────────────────────────────────────
  //  Countdown Timers
  // ─────────────────────────────────────────────
  function initCountdowns() {
    const timers = document.querySelectorAll('[data-countdown]');

    function update() {
      const now = Date.now();
      timers.forEach(timer => {
        const ends = new Date(timer.dataset.countdown).getTime();
        const starts = new Date(timer.dataset.start || timer.dataset.countdown).getTime();

        let diff, label;
        if (now < starts) {
          diff = starts - now;
          label = 'Starts in';
        } else if (now < ends) {
          diff = ends - now;
          label = 'Ends in';
        } else {
          timer.querySelector('.countdown-label').textContent = 'Ended';
          timer.querySelector('.countdown-timer').textContent = '—';
          return;
        }

        const days = Math.floor(diff / 86400000);
        const hrs = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);

        const labelEl = timer.querySelector('.countdown-label');
        const timerEl = timer.querySelector('.countdown-timer');

        if (labelEl) labelEl.textContent = label;
        if (timerEl) {
          timerEl.textContent = days > 0
            ? `${days}d ${hrs}h`
            : `${hrs}h ${mins}m`;
        }
      });
    }

    update();
    setInterval(update, 60000);
  }

  // ─────────────────────────────────────────────
  //  Event Filter
  // ─────────────────────────────────────────────
  function initEventFilter() {
    const tabs = document.querySelectorAll('[data-event-tab]');
    const cards = document.querySelectorAll('[data-event-status]');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.eventTab;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        cards.forEach(card => {
          const show = target === 'all' || card.dataset.eventStatus === target;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // ─────────────────────────────────────────────
  //  News Filter
  // ─────────────────────────────────────────────
  function initNewsFilter() {
    const chips = document.querySelectorAll('[data-category-chip]');
    const items = document.querySelectorAll('[data-news-category]');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.dataset.categoryChip;

        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        items.forEach(item => {
          const show = target === 'all' || item.dataset.newsCategory === target;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // ─────────────────────────────────────────────
  //  Character Filter
  // ─────────────────────────────────────────────
  function initCharFilter() {
    const elementBtns = document.querySelectorAll('[data-el-filter]');
    const weaponBtns = document.querySelectorAll('[data-weapon-filter]');
    const rarityBtns = document.querySelectorAll('[data-rarity-filter]');
    const cards = document.querySelectorAll('[data-char]');

    function applyFilters() {
      const el = document.querySelector('[data-el-filter].active')?.dataset.elFilter || 'All';
      const weapon = document.querySelector('[data-weapon-filter].active')?.dataset.weaponFilter || 'All';
      const rarity = document.querySelector('[data-rarity-filter].active')?.dataset.rarityFilter || 'All';

      let count = 0;
      cards.forEach(card => {
        const matchEl = el === 'All' || card.dataset.el === el;
        const matchWeapon = weapon === 'All' || card.dataset.weapon === weapon;
        const matchRarity = rarity === 'All' || card.dataset.rarity === rarity;
        const show = matchEl && matchWeapon && matchRarity;
        card.style.display = show ? '' : 'none';
        if (show) count++;
      });

      const countEl = document.getElementById('char-count');
      if (countEl) countEl.textContent = count;
    }

    elementBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elementBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });

    weaponBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        weaponBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });

    rarityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rarityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  // ─────────────────────────────────────────────
  //  Mobile Nav
  // ─────────────────────────────────────────────
  function initMobileNav() {
    const toggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.mobile-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ─────────────────────────────────────────────
  //  Navbar Scrolled State
  // ─────────────────────────────────────────────
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ─────────────────────────────────────────────
  //  Active Nav Link
  // ─────────────────────────────────────────────
  function initActiveNav() {
    const links = document.querySelectorAll('.nav-links a');
    const path = location.pathname;

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (path === '/' && href === 'index.html') || (path === '/' && href === '/')) {
        link.classList.add('active');
      } else if (href && path.includes(href.replace('./', '').replace('.html', ''))) {
        link.classList.add('active');
      }
    });
  }

  // ─────────────────────────────────────────────
  //  Type-to-Search (Cmd+K)
  // ─────────────────────────────────────────────
  function initSearch() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.createElement('input');
        input.placeholder = 'Search characters, events...';
        input.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);padding:1rem 1.5rem;background:rgba(15,22,41,0.95);border:1px solid rgba(0,229,255,0.3);border-radius:12px;color:#fff;font-size:1rem;z-index:9999;outline:none;width:400px;max-width:90vw;';
        input.addEventListener('blur', () => input.remove());
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape') input.remove();
        });
        document.body.appendChild(input);
        input.focus();
      }
    });
  }

  // ─────────────────────────────────────────────
  //  Parallax Hero Scroll Effect
  // ─────────────────────────────────────────────
  function initHeroParallax() {
    const hero = document.querySelector('.hero-slides');
    if (!hero) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (hero) hero.style.transform = `translateY(${scrollY * 0.3}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─────────────────────────────────────────────
  //  Init All
  // ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initScrollProgress();
    initHeroSlides();
    initScrollReveal();
    initCountdowns();
    initEventFilter();
    initNewsFilter();
    initCharFilter();
    initMobileNav();
    initNavbarScroll();
    initActiveNav();
    initSearch();
    initHeroParallax();
  });

})();
