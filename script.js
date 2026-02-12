// Main XRRONA FX front-end script

// Global state
let cursorEnabled = false;
let threeContext = null;

/**
 * Helper: select all
 */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * Loading screen animation using GSAP
 */
function initLoadingScreen() {
  const screen = $("#loading-screen");
  const barFill = $(".loading-bar-fill");
  const titlePrimary = $(".loading-title .word-primary");
  const titleSecondary = $(".loading-title .word-secondary");

  if (!screen || !barFill) return;

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" }
  });

  tl
    .fromTo(
      barFill,
      { scaleX: 0.1, transformOrigin: "left center" },
      { scaleX: 1, duration: 1.4, repeat: 1, yoyo: true }
    )
    .from(
      [titlePrimary, titleSecondary],
      { yPercent: 40, opacity: 0, stagger: 0.12, duration: 0.6 },
      0.2
    )
    .to(
      screen,
      {
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        pointerEvents: "none",
        onComplete: () => {
          screen.remove();
        }
      },
      ">-=0.1"
    );
}

/**
 * Custom cursor glow
 */
function initCursorGlow() {
  const cursor = $(".cursor-glow");
  if (!cursor) return;

  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!finePointer) {
    cursorEnabled = false;
    cursor.style.display = "none";
    return;
  }

  cursorEnabled = true;

  window.addEventListener("pointermove", (event) => {
    if (!cursorEnabled) return;
    const { clientX, clientY } = event;
    gsap.to(cursor, {
      x: clientX,
      y: clientY,
      duration: 0.4,
      ease: "expo.out",
      overwrite: true,
      onStart: () => {
        if (cursor.style.opacity !== "1") {
          gsap.to(cursor, { opacity: 1, duration: 0.3, ease: "power2.out" });
        }
      }
    });
  });

  window.addEventListener("pointerleave", () => {
    gsap.to(cursor, { opacity: 0, duration: 0.3 });
  });
}

/**
 * Navigation: burger toggle + smooth scroll with GSAP ScrollToPlugin
 */
function initNavigation() {
  const burger = $(".nav-burger");
  const navRight = $(".nav-right");

  if (burger && navRight) {
    burger.addEventListener("click", () => {
      navRight.classList.toggle("is-open");
    });
  }

  $$("[data-scroll-to]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      event.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;

      // Close mobile nav
      if (navRight && navRight.classList.contains("is-open")) {
        navRight.classList.remove("is-open");
      }

      gsap.to(window, {
        duration: 1,
        ease: "power3.inOut",
        scrollTo: { y: target, offsetY: 80 }
      });
    });
  });
}

/**
 * GSAP scroll reveal animations
 */
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // Hero entrance
  const heroElements = $$("[data-animate='hero'], [data-animate='hero-ui'], [data-animate='badge']");
  gsap.set(heroElements, { opacity: 0, y: 40 });

  gsap.to(heroElements, {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.4
  });

  // Section titles
  $$("[data-animate='section-title']").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // Preview cards
  $$("[data-animate='preview-card']").forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 60,
      rotateX: -10,
      transformOrigin: "center bottom",
      duration: 0.8,
      ease: "power3.out",
      delay: index * 0.03,
      scrollTrigger: {
        trigger: card,
        start: "top 82%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // Feature cards
  $$("[data-animate='feature-card']").forEach((card) => {
    gsap.from(card, {
      opacity: 0,
      y: 40,
      scale: 0.96,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // Why items
  $$("[data-animate='why']").forEach((item, i) => {
    gsap.from(item, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power3.out",
      delay: i * 0.04,
      scrollTrigger: {
        trigger: item,
        start: "top 86%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // Download block
  const dlText = "[data-animate='download']";
  const dlBtn = "[data-animate='download-btn']";
  [dlText, dlBtn].forEach((selector) => {
    const el = $(selector);
    if (!el) return;
    gsap.from(el, {
      opacity: 0,
      y: 46,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 84%",
        toggleActions: "play none none reverse"
      }
    });
  });
}

/**
 * Lightbox for preview images
 */
function initPreviewLightbox() {
  const items = $$(".preview-item");
  const lightbox = $("#lightbox");
  const img = $(".lightbox-image");
  const caption = $(".lightbox-caption");
  const closeBtn = $(".lightbox-close");
  if (!items.length || !lightbox || !img || !caption || !closeBtn) return;

  const open = (src, text) => {
    img.src = src;
    caption.textContent = text || "";
    gsap.to(lightbox, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
      onStart: () => {
        lightbox.style.pointerEvents = "auto";
        lightbox.setAttribute("aria-hidden", "false");
      }
    });
  };

  const close = () => {
    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => {
        lightbox.style.pointerEvents = "none";
        lightbox.setAttribute("aria-hidden", "true");
      }
    });
  };

  items.forEach((item) => {
    const image = $("img", item);
    const text = $("figcaption", item);
    item.addEventListener("click", () => {
      if (!image) return;
      open(image.src, text ? text.textContent : "");
    });
  });

  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.getAttribute("aria-hidden") === "false") {
      close();
    }
  });
}

/**
 * Simple 3D tilt / hover parallax for cards and hero UI
 */
function initTiltCards() {
  const tiltCards = $$(".tilt");

  const maxTilt = 10;

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        translateZ: 20,
        transformPerspective: 800,
        duration: 0.4,
        ease: "power3.out",
        overwrite: true
      });
    });

    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        translateZ: 0,
        duration: 0.6,
        ease: "power3.out"
      });
    });
  });
}

/**
 * Hero parallax effect (text vs background)
 */
function initHeroParallax() {
  const hero = $(".hero");
  const copy = $(".hero-copy");
  const ui = $(".hero-ui-card");

  if (!hero || !copy || !ui) return;

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(copy, {
      x: relX * -20,
      y: relY * -12,
      duration: 0.6,
      ease: "power3.out"
    });

    gsap.to(ui, {
      x: relX * 26,
      y: relY * 20,
      duration: 0.6,
      ease: "power3.out"
    });
  });
}

/**
 * Hero preview button (scroll to preview section)
 */
function initHeroPreviewButton() {
  const btn = document.querySelector("[data-preview]");
  const previewSection = document.querySelector("#preview");
  if (!btn || !previewSection) return;

  btn.addEventListener("click", () => {
    gsap.to(window, {
      duration: 1,
      ease: "power3.inOut",
      scrollTo: { y: previewSection, offsetY: 80 }
    });
  });
}

/**
 * Three.js 3D background: floating neon shapes
 */
function initThreeBackground() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030308, 0.12);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.6, 4);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const pointPurple = new THREE.PointLight(0xb026ff, 2, 14);
  pointPurple.position.set(-2, 1.5, 2);
  scene.add(pointPurple);

  const pointPink = new THREE.PointLight(0xff4fd8, 1.6, 12);
  pointPink.position.set(2, -0.5, 1.8);
  scene.add(pointPink);

  // Geometries
  const torusGeo = new THREE.TorusKnotGeometry(0.9, 0.18, 180, 24);
  const icosaGeo = new THREE.IcosahedronGeometry(0.7, 1);
  const smallSphereGeo = new THREE.SphereGeometry(0.12, 16, 16);

  const materialNeon = new THREE.MeshStandardMaterial({
    color: 0xb026ff,
    roughness: 0.2,
    metalness: 0.7,
    emissive: 0x5d16ff,
    emissiveIntensity: 0.9
  });

  const materialPink = new THREE.MeshStandardMaterial({
    color: 0xff4fd8,
    roughness: 0.15,
    metalness: 0.8,
    emissive: 0x7c1640,
    emissiveIntensity: 0.8
  });

  const torus = new THREE.Mesh(torusGeo, materialNeon);
  torus.position.set(-0.8, 0.4, 0);
  scene.add(torus);

  const icosa = new THREE.Mesh(icosaGeo, materialPink);
  icosa.position.set(1.1, -0.2, -0.5);
  scene.add(icosa);

  // Small floating orbs
  const orbs = [];
  for (let i = 0; i < 18; i++) {
    const orb = new THREE.Mesh(
      smallSphereGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xb026ff,
        emissiveIntensity: 1.4,
        roughness: 0.1,
        metalness: 0.9
      })
    );
    const radius = 2.4 + Math.random() * 0.9;
    const angle = Math.random() * Math.PI * 2;
    orb.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 1.6,
      Math.sin(angle) * radius
    );
    scene.add(orb);
    orbs.push({ mesh: orb, angle, radius, speed: 0.2 + Math.random() * 0.4 });
  }

  // Background particles (points)
  const particlesGeo = new THREE.BufferGeometry();
  const particleCount = 280;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particlesMat = new THREE.PointsMaterial({
    color: 0xb026ff,
    size: 0.03,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });

  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // Mouse parallax -> adjust camera
  const mouse = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    mouse.x = x;
    mouse.y = y;
  });

  // Resize
  window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  const clock = new THREE.Clock();

  const renderLoop = () => {
    const elapsed = clock.getElapsedTime();

    // Shape animation
    torus.rotation.x = elapsed * 0.28;
    torus.rotation.y = elapsed * 0.18;
    icosa.rotation.x = elapsed * -0.24;
    icosa.rotation.y = elapsed * 0.32;

    orbs.forEach((orbData, i) => {
      orbData.angle += orbData.speed * 0.02;
      const yOffset = Math.sin(elapsed * (0.8 + i * 0.07)) * 0.3;
      orbData.mesh.position.x = Math.cos(orbData.angle) * orbData.radius;
      orbData.mesh.position.z = Math.sin(orbData.angle) * orbData.radius;
      orbData.mesh.position.y = yOffset;
    });

    // Subtle particles drift
    particles.rotation.y = elapsed * 0.03;

    // Camera parallax
    const targetX = mouse.x * 0.4;
    const targetY = -mouse.y * 0.25;
    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  };

  renderLoop();

  threeContext = { scene, camera, renderer };
}

/**
 * Initialize everything once DOM & external scripts are ready
 */
window.addEventListener("load", () => {
  initLoadingScreen();
  initCursorGlow();
  initNavigation();
  initScrollAnimations();
  initPreviewLightbox();
  initTiltCards();
  initHeroParallax();
  initHeroPreviewButton();
  initThreeBackground();
});