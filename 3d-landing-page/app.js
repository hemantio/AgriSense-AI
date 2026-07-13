// app.js - AgriSense AI 3D Scroll-Driven Landing Page

document.addEventListener('DOMContentLoaded', () => {
  // 1. Starscape Background
  const initStarscape = () => {
    const canvas = document.getElementById('starscape');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    const starCount = 180;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      generateStars();
    };

    const generateStars = () => {
      stars = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.2 + 0.3,
          baseOpacity: Math.random() * 0.6 + 0.2,
          driftX: (Math.random() - 0.5) * 0.04,
          driftY: (Math.random() - 0.5) * 0.02,
          twinkleSpeed: Math.random() * 0.005 + 0.002,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    };

    const animateStars = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      stars.forEach(star => {
        // Drift
        star.x += star.driftX;
        star.y += star.driftY;

        // Wrap around boundaries
        if (star.x < 0) star.x = w;
        if (star.x > w) star.x = 0;
        if (star.y < 0) star.y = h;
        if (star.y > h) star.y = 0;

        // Twinkle (sine wave fluctuation)
        const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinklePhase);
        const opacity = Math.max(0.1, Math.min(1, star.baseOpacity + twinkle * 0.25));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animateStars);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateStars();
  };

  // 2. Navbar & Scroll Progress Bar
  const initScrollIndicators = () => {
    const navbar = document.getElementById('navbar');
    const scrollProgress = document.getElementById('scrollProgress');

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

      // Scroll Progress Bar
      if (scrollProgress) {
        scrollProgress.style.width = pct + '%';
      }

      // Navbar Shrink / Pill State
      if (navbar) {
        navbar.classList.toggle('nav-scrolled', scrollY > 60);
      }
    }, { passive: true });
  };

  // 3. Frame Preloading & Loading Screen
  const frameCount = 100;
  const frames = [];
  let loadedCount = 0;

  const preloadFrames = (onComplete) => {
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loaderBar');

    const updateLoader = (pct) => {
      if (loaderBar) {
        loaderBar.style.width = pct * 100 + '%';
      }
    };

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      // Pad frame number to 4 digits: frame_0001.jpg
      const frameNum = String(i).padStart(4, '0');
      img.src = `frames/frame_${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        updateLoader(loadedCount / frameCount);

        if (loadedCount === frameCount) {
          // Fade out loader
          if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
              loader.style.display = 'none';
            }, 600);
          }
          if (onComplete) onComplete();
        }
      };

      img.onerror = () => {
        // Handle error and keep loading counter increments so load finishes
        loadedCount++;
        updateLoader(loadedCount / frameCount);
        if (loadedCount === frameCount && onComplete) {
          onComplete();
        }
      };

      frames.push(img);
    }
  };

  // 4. Canvas Animation (Video Scrubbing) & Annotation Cards
  const initCanvasAnimation = () => {
    const canvas = document.getElementById('frameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const animationSection = document.querySelector('.scroll-animation');
    const cards = document.querySelectorAll('.annotation-card');

    let currentFrame = -1;
    let ticking = false;

    // Annotation setup
    const SNAP_ZONES = [];
    const HOLD_DURATION = 500; // time to lock scroll on card entry in ms
    let isSnapping = false;

    cards.forEach((card, index) => {
      SNAP_ZONES.push({
        show: parseFloat(card.dataset.show),
        hide: parseFloat(card.dataset.hide),
        snapped: false,
        element: card
      });
    });

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      if (currentFrame >= 0) drawFrame(currentFrame);
    };

    const drawFrame = (index) => {
      const img = frames[index];
      if (!img || img.naturalWidth === 0) return;

      const cw = window.innerWidth;
      const ch = window.innerHeight;
      ctx.clearRect(0, 0, cw, ch);

      const imgWidth = img.width;
      const imgHeight = img.height;
      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = cw / ch;

      let drawW, drawH, drawX, drawY;

      if (cw > 768) {
        // Desktop: cover-fit
        if (canvasRatio > imgRatio) {
          drawW = cw;
          drawH = cw / imgRatio;
        } else {
          drawH = ch;
          drawW = ch * imgRatio;
        }
      } else {
        // Mobile: zoomed contain-fit
        const zoomFactor = 1.35;
        if (canvasRatio > imgRatio) {
          drawH = ch * zoomFactor;
          drawW = drawH * imgRatio;
        } else {
          drawW = cw * zoomFactor;
          drawH = drawW / imgRatio;
        }
      }

      drawX = (cw - drawW) / 2;
      drawY = (ch - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    const updateAnnotationCards = (progress) => {
      SNAP_ZONES.forEach((zone) => {
        const isVisible = progress >= zone.show && progress <= zone.hide;
        zone.element.classList.toggle('visible', isVisible);

        // Snap-Stop: freeze scroll briefly when entering a snap zone
        if (isVisible && !zone.snapped && !isSnapping) {
          zone.snapped = true;
          isSnapping = true;

          // Lock scrolling
          document.body.style.overflow = 'hidden';

          // Visual snap effect (smooth scroll window to target spot)
          const rect = animationSection.getBoundingClientRect();
          const scrollableHeight = animationSection.offsetHeight - window.innerHeight;
          const targetScrollY = window.scrollY + rect.top + (zone.show * scrollableHeight);
          
          window.scrollTo({
            top: targetScrollY,
            behavior: 'auto'
          });

          setTimeout(() => {
            document.body.style.overflow = '';
            isSnapping = false;
          }, HOLD_DURATION);
        }

        // Reset snapped state when exiting zone
        if (!isVisible) {
          zone.snapped = false;
        }
      });
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = animationSection.getBoundingClientRect();
          const scrollableHeight = animationSection.offsetHeight - window.innerHeight;
          
          // Calculate progress between 0 and 1
          let progress = -rect.top / scrollableHeight;
          progress = Math.max(0, Math.min(1, progress));

          // Determine frame index
          const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));

          if (frameIndex !== currentFrame) {
            currentFrame = frameIndex;
            drawFrame(frameIndex);
          }

          updateAnnotationCards(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    
    resizeCanvas();
    // Draw initial frame (first frame)
    drawFrame(0);
  };

  // 5. Specs Section Count-Up Easing Animation
  const initSpecsCountUp = () => {
    const specsSection = document.getElementById('specs');
    if (!specsSection) return;

    const easeOutExpo = (t) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const runCountUp = (el, target, suffix = '', duration = 2200) => {
      const startTime = performance.now();
      el.classList.add('counting');

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const currentVal = eased * target;

        // Decimal handling: keep 1 decimal if target has a decimal
        if (target % 1 === 0) {
          el.textContent = Math.floor(currentVal) + suffix;
        } else {
          el.textContent = currentVal.toFixed(1) + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = target + suffix;
          el.classList.remove('counting');
        }
      };

      requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll('.spec-item');
          items.forEach((item, index) => {
            const numEl = item.querySelector('.spec-number');
            const target = parseFloat(item.dataset.target);
            const suffix = item.dataset.suffix || '';

            if (numEl) {
              // Staggered delay for count up triggers
              setTimeout(() => {
                runCountUp(numEl, target, suffix);
              }, index * 200);
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(specsSection);
  };

  // 6. Testimonials Drag-to-Scroll Slider
  const initTestimonialsSlider = () => {
    const track = document.querySelector('.testimonials-track');
    if (!track) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('active');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('active');
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('active');
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5; // scroll speed multiplier
      track.scrollLeft = scrollLeft - walk;
    });
  };

  // 7. Interactive Digital Twin Control Center
  const twinPhases = {
    1: {
      title: "Phase 1: Pure Land",
      desc: "The farmer sees only the physical land. Fragmented information, hidden crop stresses, and uncertain weather conditions create a reactive environment.",
      stat1Val: "10%",
      stat1Lbl: "Visibility",
      stat2Val: "Reactive",
      stat2Lbl: "Operating Mode",
      image: "assets/phase1.png",
      hudClasses: [],
      activeScanner: false
    },
    2: {
      title: "Phase 2: Weather Systems",
      desc: "AgriSense AI maps real-time micro-climate dynamics and weather patterns directly onto the farm coordinates, preparing the farmer for oncoming rain fronts.",
      stat1Val: "45%",
      stat1Lbl: "Data Mapping",
      stat2Val: "90%",
      stat2Lbl: "Forecast Accuracy",
      image: "assets/phase2.png",
      hudClasses: ["hud-weather-layer"],
      activeScanner: false
    },
    3: {
      title: "Phase 3: Crop Health Reveal",
      desc: "Computer vision identifies crop health indices and leaf anomalies. Thermal and multispectral heatmaps expose early-stage stress before the naked eye can detect it.",
      stat1Val: "95%",
      stat1Lbl: "Detection Accuracy",
      stat2Val: "Early",
      stat2Lbl: "Stress Alert",
      image: "assets/phase3.png",
      hudClasses: [],
      activeScanner: false
    },
    4: {
      title: "Phase 4: AI Analysis Scan",
      desc: "Deep learning models scan leaf details to diagnose pests and diseases, generating instant bounding-box classifications and prescriptive remedies.",
      stat1Val: "1.2s",
      stat1Lbl: "Analysis Speed",
      stat2Val: "95.4%",
      stat2Lbl: "Diagnostic Accuracy",
      image: "assets/phase4.png",
      hudClasses: ["hud-weather-layer", "hud-scan-layer"],
      activeScanner: true
    },
    5: {
      title: "Phase 5: Recommendations Emerge",
      desc: "AI recommendations suggest precise input amounts, watering patterns, and optimal harvesting schedules, translated and narrated in the farmer's regional language.",
      stat1Val: "20%+",
      stat1Lbl: "Yield Increase",
      stat2Val: "Voice",
      stat2Lbl: "Delivery Mode",
      image: "assets/phase5.png",
      hudClasses: ["hud-recs-layer"],
      activeScanner: false
    },
    6: {
      title: "Phase 6: Connected Ecosystem",
      desc: "Multiple farms are mapped into a unified regional coordination network, enabling peer-to-peer asset sharing, regional weather warning broadcasts, and resource planning.",
      stat1Val: "100%",
      stat1Lbl: "Village Connected",
      stat2Val: "Unified",
      stat2Lbl: "Farm Network",
      image: "assets/phase6.png",
      hudClasses: ["hud-network-layer"],
      activeScanner: false
    }
  };

  window.switchTwinPhase = (phaseNum) => {
    const buttons = document.querySelectorAll('.twin-tab-btn');
    buttons.forEach((btn, index) => {
      btn.classList.toggle('active', index + 1 === phaseNum);
    });

    const twinImage = document.getElementById('twinImage');
    const twinTitle = document.getElementById('twinTitle');
    const twinDesc = document.getElementById('twinDesc');
    const twinStatVal = document.getElementById('twinStatVal');
    const twinStatLbl = document.getElementById('twinStatLbl');
    const twinStatVal2 = document.getElementById('twinStatVal2');
    const twinStatLbl2 = document.getElementById('twinStatLbl2');
    const twinHud = document.getElementById('twinHud');

    if (!twinImage) return;

    // Smooth image fade
    twinImage.style.opacity = '0';
    setTimeout(() => {
      const data = twinPhases[phaseNum];
      if (!data) return;

      twinImage.src = data.image;
      twinTitle.textContent = data.title;
      twinDesc.textContent = data.desc;
      twinStatVal.textContent = data.stat1Val;
      twinStatLbl.textContent = data.stat1Lbl;
      twinStatVal2.textContent = data.stat2Val;
      twinStatLbl2.textContent = data.stat2Lbl;

      // Toggle HUD visibility
      if (twinHud) {
        // Reset classes
        twinHud.className = 'twin-hud';
        if (data.activeScanner) {
          twinHud.classList.add('active-scanner');
        }

        // Toggle layer classes
        const layers = twinHud.querySelectorAll('.hud-layer');
        layers.forEach(layer => {
          layer.classList.remove('visible');
        });

        data.hudClasses.forEach(cls => {
          const layer = twinHud.querySelector('.' + cls);
          if (layer) {
            layer.classList.add('visible');
          }
        });
      }

      twinImage.style.opacity = '1';
    }, 200);
  };

  // Start initialization after frame preload finishes
  initStarscape();
  initScrollIndicators();
  preloadFrames(() => {
    initCanvasAnimation();
    initSpecsCountUp();
    initTestimonialsSlider();
    // Pre-initialize the first phase's HUD state
    window.switchTwinPhase(1);
  });
});
