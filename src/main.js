import './style.css'

document.addEventListener('DOMContentLoaded', () => {

  // --- Smooth Scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if(targetId && targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
      }
    });
  });

  // --- Scroll to Top Arrow Logic (null-safe) ---
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    function limitMax(val, minLim) {
       return val > minLim ? val : minLim;
    }
    window.addEventListener('scroll', () => {
      const threshold = document.documentElement.scrollHeight / 2;
      if (window.scrollY > limitMax(threshold, 600)) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Background Slideshow Logic ---
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;
  
  if (slides.length > 1) {
    setInterval(() => {
        let lastSlide = currentSlide;
        currentSlide = (currentSlide + 1) % slides.length;
        slides[lastSlide].classList.add('last-active');
        slides[lastSlide].classList.remove('active');
        slides[currentSlide].classList.add('active');
        setTimeout(() => {
            slides[lastSlide].classList.remove('last-active');
        }, 1500);
    }, 5000); 
  }

  // --- Mobile Hamburger Menu ---
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const navItems = document.querySelectorAll('.nav-item');

  if (hamburger && navMenu) {
    let scrollY = 0;

    function lockScroll() {
      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    }

    function unlockScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollY);
    }

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      if (isOpen) {
        lockScroll();
      } else {
        unlockScroll();
      }
    });

    navItems.forEach(item => {
      item.addEventListener('click', event => {
        const href = item.getAttribute('href');
        const targetId = href && href.startsWith('#') ? href : null;

        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        unlockScroll();

        if (targetId && targetId !== '#') {
          const target = document.querySelector(targetId);
          if (target) {
            event.preventDefault();
            setTimeout(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }
        } else if (targetId === '#') {
          event.preventDefault();
        }
      });
    });
  }

  // --- Intersection Observer for Scroll Animations ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    root: null,
    threshold: 0.05,
    rootMargin: "0px 0px -30px 0px"
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // --- Auto-reveal elements already in viewport on page load ---
  setTimeout(() => {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('active');
      }
    });
  }, 100);

});
