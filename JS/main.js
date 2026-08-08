// hackatime auth
const HACKATIME_CLIENT_ID = "kvuePzAGn_PdqDlcyp037OYoaW72pFEnXYs1XkZCaUg";
const HACKATIME_REDIRECT_URI = "http://localhost:5500/";
const HACKATIME_AUTH_URL = "https://hackatime.hackclub.com/oauth/authorize";
const HACKATIME_TOKEN_URL = "https://hackatime.hackclub.com/oauth/token";

// HACKATIME PKCE
function generateRandomString(length = 64) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  let result = "";

  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}


async function generateCodeChallenge(verifier) {

  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}


async function loginToHackatime() {

  const codeVerifier = generateRandomString(64);
  const codeChallenge =
    await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  sessionStorage.setItem(
    "hackatime_code_verifier",
    codeVerifier
  );

  sessionStorage.setItem(
    "hackatime_oauth_state",
    state
  );

  const params = new URLSearchParams({

    client_id: HACKATIME_CLIENT_ID,
    redirect_uri: HACKATIME_REDIRECT_URI,
    response_type: "code",
    scope: "profile read",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"

  });

  window.location.href =
    `${HACKATIME_AUTH_URL}?${params.toString()}`;
}

// Hackatime callback

async function handleHackatimeCallback() {

    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    //user denied auth

    if (error) {
      console.error("Hackatime authorization error:", error);
      return;
    }

    // No authorization code
    if (!code) {
      return;
    }

    const savedState = sessionStorage.getItem("hackatime_oauth_state");
    const codeVerifier = sessionStorage.getItem("hactime_code_verifier");

    // Security check
    if (!SavedState || returnedState !== savedState) {
      console.error("Hacktime OAuth")
}

// LOGIN BUTTON

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  if (!loginButton) return;

  loginButton.addEventListener("click", () => {
    console.log("Hackatime button clicked");
    loginToHackatime();
  });
});

// types.js

const tooltip = document.querySelector("#hover-tooltip, #tooltip");
const tooltipLanguage = document.querySelector("#hover-tooltip-language, #tooltip-language");
const tooltipHours = document.querySelector("#hover-tooltip-hours, #tooltip-hours");

console.log(tooltip);
console.log(tooltipLanguage);
console.log(tooltipHours);

new Typed("#element", {
  strings: [
    "AI/ML Engineering",
    "Embedded Systems Developeing",
    "IOT Engineering", "yapper"
  ],
  typeSpeed: 35,
  backSpeed: 35,
  loop: true
});

// magnatic dock

const dock = document.getElementById("dock");
const items = [...document.querySelectorAll(".dock-item")];

const ICON_SIZE = 45;
const MAX_SCALE = 1.38;
const MAGNETIC_DISTANCE = 150;

let mouseX = Infinity;

const state = [];

items.forEach((item, index) => {

  state.push({

    element: item,
    scale: 1,
    targetScale: 1,
    offsetY: 0,
    targetOffsetY: 0,
    velocityScale: 0,
    velocityY: 0

  });

});

// helper

function clamp(value, min, max) {

  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {

  return a + (b - a) * t;
}

// mouse Position

dock.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
});

dock.addEventListener("mouseleave", () => {
  mouseX = Infinity;
});

// Spring Animation

const SPRING = 0.14;
const DAMPING = 0.50;

function animate() {

  updateTargets();

  let totalWidth = 0;
  let tallest = ICON_SIZE;
  let maxScale = 1;

  // Update physics
  state.forEach(obj => {

    const scaleForce = (obj.targetScale - obj.scale) * SPRING;
    obj.velocityScale += scaleForce;
    obj.velocityScale *= DAMPING;
    obj.scale += obj.velocityScale;

    const yForce = (obj.targetOffsetY - obj.offsetY) * SPRING;
    obj.velocityY += yForce;
    obj.velocityY *= DAMPING;
    obj.offsetY += obj.velocityY;

    if (obj.scale > maxScale) {
      maxScale = obj.scale;
    }

    const currentSize = ICON_SIZE * obj.scale;

    totalWidth += currentSize;

    if (currentSize > tallest) {
      tallest = currentSize;
    }

  });

  // Dynamic Dock Size

  const GAP = 6;
  const BASE_PADDING = 10;

  totalWidth += GAP * (state.length - 1);
  totalWidth += BASE_PADDING * 2;

  dock.style.width = totalWidth + "px";
  let requiredHeight = 0;

  state.forEach(obj => {

    const currentSize = ICON_SIZE * obj.scale;

    const iconHeight = currentSize + Math.abs(obj.offsetY);

    if (iconHeight > requiredHeight) {
      requiredHeight = iconHeight;
    }

  });

  dock.style.height = (requiredHeight + 24) + "px";

  // Keep dock perfectly centered

  dock.parentElement.style.left = "50%";
  dock.parentElement.style.transform = "translateX(-50%)";

  // Position icons

  let currentX = BASE_PADDING;

  state.forEach(obj => {

    const currentSize = ICON_SIZE * obj.scale;

    obj.element.style.position = "absolute";
    obj.element.style.left = currentX + "px";
    obj.element.style.bottom = "8px";
    obj.element.style.width = currentSize + "px";
    obj.element.style.height = currentSize + "px";
    obj.element.style.transform =
      `translateY(${obj.offsetY}px)`;

    currentX += currentSize + GAP;

  });

  requestAnimationFrame(animate);
}

animate();

// Click Active State

items.forEach(item => {

  item.addEventListener("click", () => {
    items.forEach(button => {
      button.classList.remove("active");
    });

    item.classList.add("active");
    const section =
      document.getElementById(
        item.dataset.section
      );

    if (section) {
      section.scrollIntoView({
        behavior: "smooth"
      });

    }

  });

});


// MacOS Neighbor Wave + Scroll Spy + Hover Glow


function smoothstep(x) {
  return x * x * (3 - 2 * x);
}

function updateTargets() {

  state.forEach((obj, index) => {
    const rect = obj.element.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = mouseX - center;
    const abs = Math.abs(distance);
    let influence = 0;

    if (abs < MAGNETIC_DISTANCE) {
      influence = 1 - (abs / MAGNETIC_DISTANCE);
      influence = smoothstep(influence);
    }

    obj.targetScale =
      1 + influence * (MAX_SCALE - 1);

    obj.targetOffsetY =
      -14 * influence;

    obj.influence = influence;

  });

  // Neighbor wave (Mac Dock effect)

  for (let i = 0; i < state.length; i++) {
    let wave = state[i].influence;

    if (state[i - 1]) {
      wave = Math.max(
        wave,
        state[i - 1].influence * 0.55
      );
    }

    if (state[i + 1]) {
      wave = Math.max(
        wave,
        state[i + 1].influence * 0.55
      );
    }

    state[i].targetScale =
      1 + wave * (MAX_SCALE - 1);

    state[i].targetOffsetY =
      -14 * wave;

  }
}

// Hover Glow

items.forEach(item => {

  item.addEventListener("mouseenter", () => {
    item.style.boxShadow =

      `0 10px 35px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.75),
        0 0 28px rgba(255,255,255,.10)`;

  });

  item.addEventListener("mouseleave", () => {
    item.style.boxShadow =

      `0 6px 15px rgba(0,0,0,.25),
        inset 0 1px 0 rgba(255,255,255,.55)`;

  });

});

// Scroll Spy

const sections = [
  ...document.querySelectorAll("section")
];

window.addEventListener("scroll", () => {

  let current = "home";
  sections.forEach(section => {
    const top =
      section.offsetTop - 250;

    if (scrollY >= top) {
      current = section.id;
    }

  });

  items.forEach(button => {

    if (button.dataset.section === current) {
      button.classList.add("active");
    }

    else {
      button.classList.remove("active");
    }
  });

});

// Small Floating Idle Animation

let idleTime = 0;

function idleFloat() {

  idleTime += 0.02;

  state.forEach((obj, index) => {
    const float =
      Math.sin(idleTime + index * .4) * 1.2;
    obj.element.style.translate =
      `0 ${float}px`;

  });

  requestAnimationFrame(idleFloat);

}

idleFloat();


// Componentry SVG Icons + Shine + Active Animation

//  SVG ICONS

const SVG_ICONS = {

  home: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>`,

  about: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>
        </svg>
        `,

  experience: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        `,

  projects: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>
        </svg>
        `,

  skills: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2
        2 0 1 1-2.83 2.83l-.06-.06a1.65
        1.65 0 0 0-1.82-.33
        1.65 1.65 0 0 0-1
        1.51V21a2 2 0 1 1-4
        0v-.09A1.65 1.65 0 0 0
        9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2
        2 0 1 1-2.83-2.83l.06-.06A1.65
        1.65 0 0 0 4.6
        15a1.65 1.65 0 0 0-1.51-1H3a2
        2 0 1 1 0-4h.09A1.65
        1.65 0 0 0 4.6
        9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2
        2 0 1 1 2.83-2.83l.06.06A1.65
        1.65 0 0 0 9
        4.6a1.65 1.65 0 0 0
        1-1.51V3a2 2 0 1 1 4
        0v.09a1.65 1.65 0 0 0
        1 1.51
        1.65 1.65 0 0 0
        1.82-.33l.06-.06a2
        2 0 1 1 2.83
        2.83l-.06.06A1.65
        1.65 0 0 0
        19.4 9c0 .66.26 1.3.73
        1.77.47.47 1.11.73
        1.77.73H21a2 2 0 1 1
        0 4h-.09a1.65 1.65 0 0 0-1.51
        1z"/>
        </svg>
        `,

  contact: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1
        0-2-.9-2-2V6c0-1.1.9-2
        2-2z"/>
        <polyline points="22 6 12 13 2 6"/>
        </svg>
        `

};

// Inject Icons

items.forEach(item => {
  const icon = item.querySelector(".dock-icon");
  const key = item.dataset.section;

  if (SVG_ICONS[key]) {
    icon.innerHTML = SVG_ICONS[key];
  }
});

// Shine Overlay

items.forEach(item => {

  const shine = document.createElement("div");
  shine.className = "dock-shine";
  shine.style.position = "absolute";
  shine.style.inset = "0";
  shine.style.pointerEvents = "none";
  shine.style.borderRadius = "20px";
  shine.style.background =
    "linear-gradient(135deg,rgba(255,255,255,.55) 0%,transparent 45%,transparent 100%)";
  shine.style.opacity = ".55";
  item.appendChild(shine);

});

// Active Animation

items.forEach(item => {
  item.addEventListener("click", () => {
    item.animate(
      [
        { transform: item.style.transform },
        { transform: item.style.transform + " scale(.92)" },
        { transform: item.style.transform }
      ],

      {
        duration: 220,
        easing: "ease-out"
      });
  });
});

// Mmouse leave reset

dock.addEventListener("mouseleave", () => {
  state.forEach(obj => {
    obj.targetScale = 1;
    obj.targetOffsetY = 0;

  });

});


// Project Card 3D Tilt

document.querySelectorAll(".project-card").forEach(card => {

  let currentRotateX = 0;
  let currentRotateY = 0;
  let currentLift = 0;

  let targetRotateX = 0;
  let targetRotateY = 0;
  let targetLift = 0;

  card.addEventListener("mousemove", (e) => {

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const shineX = ((x / rect.width) * 100).toFixed(1);
    const shineY = ((y / rect.height) * 100).toFixed(1);

    card.style.setProperty("--shine-x", `${shineX}%`);
    card.style.setProperty("--shine-y", `${shineY}%`);


    targetRotateY = ((x - centerX) / centerX) * 7;
    targetRotateX = ((centerY - y) / centerY) * 7;

    targetLift = -10;

  });

  card.addEventListener("mouseleave", () => {

    targetRotateX = 0;
    targetRotateY = 0;
    targetLift = 0;

  });

  function animateCard() {

    currentRotateX += (targetRotateX - currentRotateX) * 0.12;
    currentRotateY += (targetRotateY - currentRotateY) * 0.12;
    currentLift += (targetLift - currentLift) * 0.12;

    card.style.transform = `
            perspective(1200px)
            rotateX(${currentRotateX}deg)
            rotateY(${currentRotateY}deg)
            translateY(${currentLift}px)
        `;

    requestAnimationFrame(animateCard);
  }
  animateCard();
});

// SPACE OBJECTS

const languages = [

  {
    language: "Python",
    hours: 40,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "C",
    hours: 333,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "HTML",
    hours: 23,
    image: "meteor BG removed.png"
  },

  {
    language: "CSS",
    hours: 12,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "JAVA SCRIPT",
    hours: 27,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "VIBE CODING",
    hours: 2,
    image: "meteor BG removed.png"
  },

  {
    language: "BASH TERMINAL",
    hours: 2,
    image: "meteor BG removed.png"
  },

  {
    language: "Journaling",
    hours: 8,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "Antigravity",
    hours: 0.2,
    image: "meteor BG removed.png"
  },

  {
    language: "JSON",
    hours: 0.30,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "FREE CAD",
    hours: 5,
    image: "meteor BG removed.png"
  },

  {
    language: "LAPSE",
    hours: 86,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "TYPE SCRIPT",
    hours: 0.4,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "C++",
    hours: 5,
    image: "meteor_1-removebg-preview.png"
  }

];

const spaceObjects = [];

let hoveredMeteor = null;

let mouse = {
  x: 0,
  y: 0
};

function languageToSize(hours, index = 0) {

  const safeHours = Math.max(Number(hours) || 0, 0.1);
  const normalized = Math.min(
    Math.log10(safeHours + 1) / Math.log10(151),
    1
  );

  const baseSize = 70 + normalized * 78;
  const variation = ((index % 3) - 1) * 10 + (Math.random() * 14 - 7);
  const size = Math.round(baseSize + variation);

  return Math.max(62, Math.min(165, size));

}

let languageIndex = 0;

document.querySelectorAll(".space-object").forEach(obj => {

  const isMeteor = obj.classList.contains("meteor");
  const isBroccoli = obj.classList.contains("broccoli");

  let lang = null;
  let size = 220;

  if (isMeteor) {

    lang = languages[languageIndex];
    languageIndex++;
    size = languageToSize(lang.hours, languageIndex - 1);
    obj.src = `img_assets/${lang.image}`;

  }

  const angle = Math.random() * Math.PI * 2;
  const speed =
    isBroccoli
      ? 0.45
      : 0.03 + Math.random() * 0.08


  obj.style.width = `${size}px`;
  obj.style.height = "auto";
  spaceObjects.push({

    el: obj,

    x: Math.random() * (window.innerWidth - size),
    y: Math.random() * (window.innerHeight - size),

    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,

    rotation: Math.random() * 360,
    rotationSpeed: isBroccoli ? 0.3 : (Math.random() - 0.5) * 0.08,

    size: size,
    radius: size * 0.5,
    mass: isBroccoli ? 8 : 1,

    language: lang?.language,
    hours: lang?.hours,

    scale: 1,
    isMeteor,
    isBroccoli,
    isHoverStopped: false,
    storedVx: 0,
    storedVy: 0

  });

});


function animateSpace() {

  spaceObjects.forEach(m => {

    m.x += m.vx;
    m.y += m.vy;

    m.rotation += m.rotationSpeed;

    if (m.x < 0) {
      m.x = 0;
      m.vx *= -1;
    }

    if (m.x + m.size > window.innerWidth) {
      m.x = window.innerWidth - m.size;
      m.vx *= -1;
    }

    if (m.y < 0) {
      m.y = 0;
      m.vy *= -1;
    }

    if (m.y + m.size > window.innerHeight) {
      m.y = window.innerHeight - m.size;
      m.vy *= -1;
    }


    m.el.style.transform = `
    translate(${m.x}px, ${m.y}px)
    rotate(${m.rotation}deg)
    scale(${m.scale})
    `;

  });

  let hoveringAnyMeteor = false;
  hoveredMeteor = null;

  spaceObjects.forEach(obj => {

    if (!obj.isMeteor) return;

    const centerX = obj.x + obj.size / 2;
    const centerY = obj.y + obj.size / 2;

    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const hovering = distance < (obj.radius * obj.scale);

    obj.scale = hovering ? 1.16 : 1;

    if (hovering) {

      hoveringAnyMeteor = true;
      hoveredMeteor = obj;
      if (!obj.isHoverStopped) {
        obj.storedVx = obj.vx;
        obj.storedVy = obj.vy;
        obj.isHoverStopped = true;
      }
      obj.vx = 0;
      obj.vy = 0;

      tooltip.style.opacity = "1";
      const x = Math.min(mouse.x + 20, window.innerWidth - 220);
      const y = Math.min(mouse.y + 20, window.innerHeight - 120);
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";

      tooltipLanguage.textContent = obj.language;
      tooltipHours.textContent = `${obj.hours} hrs`;

    }

  });

  if (!hoveringAnyMeteor) {
    spaceObjects.forEach(obj => {
      if (!obj.isHoverStopped) return;
      obj.vx = obj.storedVx || (Math.random() > 0.5 ? 0.06 : -0.06);
      obj.vy = obj.storedVy || (Math.random() > 0.5 ? 0.06 : -0.06);
      obj.isHoverStopped = false;
    });

    tooltip.style.opacity = "0";

  }

  for (let i = 0; i < spaceObjects.length; i++) {

    for (let j = i + 1; j < spaceObjects.length; j++) {

      const a = spaceObjects[i];
      const b = spaceObjects[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;

      const distance = Math.max(
        Math.sqrt(dx * dx + dy * dy),
        0.0001
      );

      const radiusA = a.radius * (a.scale || 1);
      const radiusB = b.radius * (b.scale || 1);

      const minDistance = radiusA + radiusB;

      if (distance >= minDistance)
        continue;

      const nx = dx / distance;
      const ny = dy / distance;

      const overlap = minDistance - distance;

      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;

      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;

      const velAlongNormal =
        rvx * nx +
        rvy * ny;

      if (velAlongNormal > 0)
        continue;

      const restitution = 1;

      const impulse =
        -(1 + restitution) *
        velAlongNormal /
        ((1 / a.mass) + (1 / b.mass));

      const ix = impulse * nx;
      const iy = impulse * ny;

      a.vx -= ix / a.mass;
      a.vy -= iy / a.mass;

      b.vx += ix / b.mass;
      b.vy += iy / b.mass;

    }

  }

  if (hoveredMeteor) {
    spaceObjects.forEach(obj => {
      if (!obj.isMeteor || obj === hoveredMeteor) return;

      const dx = hoveredMeteor.x - obj.x;
      const dy = hoveredMeteor.y - obj.y;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) return;

      const assistStrength = 0.00022;
      obj.vx += (dx / dist) * assistStrength;
      obj.vy += (dy / dist) * assistStrength;

      obj.vx = clamp(obj.vx, -0.35, 0.35);
      obj.vy = clamp(obj.vy, -0.35, 0.35);
    });
  }

  requestAnimationFrame(animateSpace);

}

animateSpace();
console.log(spaceObjects);

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
