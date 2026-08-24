// hackatime auth
const HACKATIME_CLIENT_ID = "kvuePzAGn_PdqDlcyp037OYoaW72pFEnXYs1XkZCaUg";
const HACKATIME_REDIRECT_URI = "https://broccoli-dev.vercel.app/";
const HACKATIME_AUTH_URL = "https://hackatime.hackclub.com/oauth/authorize";

const manualProjectHours = {
  "Flipper Black": 90,
  "ARIA": 23,
  "Broccoli board": 65,
  "N-X-H-desktop-Hud": 23
};

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

  localStorage.setItem(
    "hackatime_code_verifier",
    codeVerifier
  );

  localStorage.setItem(
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

async function loadPublicHackatimeStats() {

  try {

    const statsResponse = await fetch(
      "https://hackatime.hackclub.com/api/summary?user_id=U0ASNE2V58Q&interval=all_time"
    );

    if (!statsResponse.ok) {
      throw new Error(
        `Hacktime public API failed: ${statsResponse.status}`
      );
    }

    const statsData = await statsResponse.json();
    const projectCards = document.querySelectorAll(".project-card");

    projectCards.forEach(card => {

      const title = card.querySelector("h3")?.textContent.trim();
      const hackatimeProject = card.dataset.hackatimeProject;

      if (!hackatimeProject) {

        if (manualProjectHours[title] !== undefined) {
          const hours = manualProjectHours[title];

          let timeElement = card.querySelector(".project-time");

          if (!timeElement) {
            timeElement = document.createElement("div");
            timeElement.className = "project-time";

            const content = card.querySelector(".project-content");

            if (content) {
              content.appendChild(timeElement);

            }
          }
          if (timeElement) {
            timeElement.textContent = `⏱ ${hours.toFixed(1)} hrs`;
          }
        }
        return;
      }

      const project = statsData.projects.find(
        p => p.key === hackatimeProject
      );

      if (!project) {
        return;
      }

      const hours = project.total / 3600;

      let timeElement = card.querySelector(".project-time");

      if (!timeElement) {
        timeElement = document.createElement("div");
        timeElement.className = "project-time";

        const content = card.querySelector(".project-content");

        if (!content) return;
        content.appendChild(timeElement);
      }
      timeElement.textContent = `⏱ ${hours.toFixed(1)} hrs`;
    });


  } catch { }
}

async function handleHackatimeCallback() {

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    return;
  }

  if (!code) {
    return;
  }

  const savedState = localStorage.getItem("hackatime_oauth_state");

  const codeVerifier =
    localStorage.getItem("hackatime_code_verifier");
  if (!savedState || state !== savedState) {
    return;
  }

  try {

    const response = await fetch(
      "/api/hackatime-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: HACKATIME_REDIRECT_URI,
          client_id: HACKATIME_CLIENT_ID
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return;
    }

    localStorage.setItem(
      "hackatime_access_token",
      data.access_token
    );

    // clean Oauth data
    localStorage.removeItem("hackatime_code_verifier");
    localStorage.removeItem("hackatime_oauth_state");

    // remove code from URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

  } catch {
    // Token request failed
  }

}

// LOGIN BUTTON

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  if (!loginButton) return;

  loginButton.addEventListener("click", () => {
    loginToHackatime();
  });
});

// types.js

const tooltip = document.getElementById("meteor-tooltip");
const tooltipLanguage = document.getElementById("meteor-tooltip-language");
const tooltipHours = document.getElementById("meteor-tooltip-time");

const tooltipButton = document.getElementById("tooltip-open");

tooltip.addEventListener("mouseenter", () => {
  tooltipHovered = true;

  if (hoveredMeteor) {
    hoveredMeteor.vx = 0;
    hoveredMeteor.vy = 0;
  }
});

tooltip.addEventListener("mouseleave", () => {
  tooltipHovered = false;
});

new Typed("#element", {
  strings: [
    "AI/ML Engineering",
    "Embedded Systems Developing",
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
        `,

  achievements: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17h4v-2.34c1.5-.75 2.5-2.28 2.5-4.02V7H7.5v3.64c0 1.74 1 3.27 2.5 4.02z"/>
        <path d="M12 17v5"/>
        </svg>
        `,

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
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "C",
    hours: 0,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "HTML",
    hours: 0,
    image: "meteor BG removed.png"
  },

  {
    language: "CSS",
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "JAVA SCRIPT",
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "BASH TERMINAL",
    hours: 0,
    image: "meteor BG removed.png"
  },

  {
    language: "Markdown",
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "JSON",
    hours: 0,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "FREE CAD",
    hours: 0,
    image: "meteor BG removed.png"
  },

  {
    language: "LAPSE",
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  },

  {
    language: "TYPE SCRIPT",
    hours: 0,
    image: "meteor_2-removebg-preview.png"
  },

  {
    language: "C++",
    hours: 0,
    image: "meteor_1-removebg-preview.png"
  }
];

// FETCH REAL HACKATIME LANGUAGE HOURS
async function loadLanguageHoursFromHackatime() {
  try {
    const response = await fetch(
      "https://hackatime.hackclub.com/api/summary?user_id=U0ASNE2V58Q&interval=all_time"
    );

    if (!response.ok) {
      throw new Error(`Hackatime API error: ${response.status}`);
    }

    const data = await response.json();

    const languageMap = {
      "Python": "Python",
      "C": "C",
      "HTML": "HTML",
      "CSS": "CSS",
      "JAVA SCRIPT": "JavaScript",
      "BASH TERMINAL": "Shell",
      "JSON": "JSON",
      "FREE CAD": "FreeCAD",
      "LAPSE": "Lapse",
      "TYPE SCRIPT": "TypeScript",
      "C++": "C++",
      "Markdown": "Markdown"
    };

    languages.forEach(meteor => {
      const hackatimeName = languageMap[meteor.language];
      if (!hackatimeName) return;

      const hackatimeLanguage = data.languages.find(
        lang => lang.key.toLowerCase() === hackatimeName.toLowerCase()
      );

      if (hackatimeLanguage) {
        meteor.hours = hackatimeLanguage.total / 3600;
      }
    });
  } catch {
    // Hackatime fetch failed, using default hours
  }

  // Initialize space objects AFTER loading real data
  initializeSpaceObjects();
}

const spaceObjects = [];

let hoveredMeteor = null;
let tooltipHovered = false;

let mouse = {
  x: 0,
  y: 0
};

let chatSidebarOpen = false;

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

// Format hours for display (1 decimal place for readability)
function formatHours(hours) {
  return hours.toFixed(1);
}

// Initialize space objects with real hackatime data
function initializeSpaceObjects() {
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

      language: lang?.language || "",
      hours: lang?.hours ?? 0,

      scale: 1,
      isMeteor,
      isBroccoli,
      isHoverStopped: false,
      storedVx: 0,
      storedVy: 0

    });
  });
}

// Load real hackatime data on page load
loadLanguageHoursFromHackatime();


// Button click handler for meteor tooltip
tooltipButton.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const language = tooltip.dataset.language;

  console.log("Jump in void clicked:", language);

  if (!language) {
    console.warn("No meteor language found.");
    return;
  }

  const targetUrl = `stats.html?language=${encodeURIComponent(language)}`;

  console.log("Opening:", targetUrl);

  window.location.assign(targetUrl);
});

function resetMeteorHoverState() {
  if (!hoveredMeteor) {
    tooltip.style.opacity = "0";
    return;
  }

  spaceObjects.forEach(obj => {
    if (!obj.isMeteor || !obj.isHoverStopped) return;
    obj.vx = obj.storedVx || (Math.random() > 0.5 ? 0.06 : -0.06);
    obj.vy = obj.storedVy || (Math.random() > 0.5 ? 0.06 : -0.06);
    obj.isHoverStopped = false;
  });

  tooltip.style.opacity = "0";
  hoveredMeteor = null;
}

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
  const sidebar = document.getElementById("broccoli-sidebar");
  const sidebarRect = sidebar?.getBoundingClientRect();
  const pointerOverChat = chatSidebarOpen && sidebarRect &&
    mouse.x >= sidebarRect.left && mouse.x <= sidebarRect.right &&
    mouse.y >= sidebarRect.top && mouse.y <= sidebarRect.bottom;

  spaceObjects.forEach(obj => {

    if (!obj.isMeteor || pointerOverChat) return;

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
      tooltip.dataset.language = obj.language;
      const x = Math.min(mouse.x + 20, window.innerWidth - 220);
      const y = Math.min(mouse.y + 20, window.innerHeight - 120);
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";

      tooltipLanguage.textContent = obj.language;
      tooltipHours.textContent = `${obj.hours.toFixed(1)} hrs`;
    }
  });

  if (pointerOverChat) {
    resetMeteorHoverState();
  }

  // Check if tooltip or button is being hovered
  const tooltipElement = document.getElementById("meteor-tooltip");
  const tooltipRect = tooltipElement.getBoundingClientRect();
  const buttonRect = tooltipElement.querySelector("#tooltip-open").getBoundingClientRect();

  // Expand hover zone to include tooltip and button
  const isNearTooltip = (mouse.x >= tooltipRect.left - 10 && mouse.x <= tooltipRect.right + 10 &&
    mouse.y >= tooltipRect.top - 10 && mouse.y <= tooltipRect.bottom + 10);
  const isNearButton = (mouse.x >= buttonRect.left - 5 && mouse.x <= buttonRect.right + 5 &&
    mouse.y >= buttonRect.top - 5 && mouse.y <= buttonRect.bottom + 5);

  // Hide immediately when the pointer leaves the active meteor, without waiting for another meteor hover.
  if (!hoveringAnyMeteor && !isNearTooltip && !isNearButton) {
    resetMeteorHoverState();
  } else if ((isNearTooltip || isNearButton) && hoveredMeteor) {
    // Keep frozen while near tooltip or button
    hoveredMeteor.vx = 0;
    hoveredMeteor.vy = 0;
    tooltip.style.opacity = "1";
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

// Setup on mouse move to track position
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});


// broccoli chat

document.addEventListener('DOMContentLoaded', () => {
  const broccoliBtn = document.getElementById('broccoli-btn');
  const sidebar = document.getElementById('broccoli-sidebar');
  const closeBtn = document.getElementById('close-sidebar');
  const resizeHandle = document.getElementById('sidebar-resize-handle');
  const sendBtn = document.getElementById('send-btn');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const popup = document.getElementById('broccoli-popup');

  const messages = [
    "yo! boiiii",
    "got a sick project idea?",
    "lets build something epic",
    "tap to chat with my AI twin"
  ];

  let msgIndex = 0;

  // Rotate messages every 4 seconds cleanly
  setInterval(() => {
    // Only rotate if the sidebar is closed
    if (sidebar.style.right !== '0px') {
      msgIndex = (msgIndex + 1) % messages.length;
      popup.textContent = messages[msgIndex];
    }
  }, 4000);


  broccoliBtn.addEventListener('click', () => {
    chatSidebarOpen = true;
    sidebar.style.right = '0';
    popup.style.display = 'none';
  });


  closeBtn.addEventListener('click', () => {
    chatSidebarOpen = false;
    sidebar.style.right = `-${sidebar.offsetWidth}px`;
    popup.style.display = 'block';
  });

  if (!broccoliBtn || !sidebar || !closeBtn || !resizeHandle || !sendBtn || !chatInput || !chatMessages) return;

  let resizeStartX;
  let resizeStartWidth;

  function startResize(event) {
    resizeStartX = event.clientX;
    resizeStartWidth = sidebar.getBoundingClientRect().width;
    sidebar.classList.add('resizing');
    resizeHandle.setPointerCapture(event.pointerId);
  }

  function resizeSidebar(event) {
    if (!sidebar.classList.contains('resizing')) return;

    const styles = getComputedStyle(sidebar);
    const minWidth = parseFloat(styles.minWidth);
    const maxWidth = parseFloat(styles.maxWidth);
    const nextWidth = resizeStartWidth + resizeStartX - event.clientX;
    const width = Math.min(maxWidth, Math.max(minWidth, nextWidth));

    sidebar.style.setProperty('--chat-sidebar-width', `${width}px`);
  }

  function stopResize(event) {
    if (!sidebar.classList.contains('resizing')) return;
    sidebar.classList.remove('resizing');
    if (resizeHandle.hasPointerCapture(event.pointerId)) {
      resizeHandle.releasePointerCapture(event.pointerId);
    }
  }

  resizeHandle.addEventListener('pointerdown', startResize);
  resizeHandle.addEventListener('pointermove', resizeSidebar);
  resizeHandle.addEventListener('pointerup', stopResize);
  resizeHandle.addEventListener('pointercancel', stopResize);

  let chatHistory = [];

  let visitorId = localStorage.getItem('broccoli_visitor_id');
  if (!visitorId) {

    visitorId = 'visitor_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('broccoli_visitor_id', visitorId);
  }

  function appendMessage(sender, text, className, id = '') {
    const msgDiv = document.createElement('div');
    if (id) msgDiv.id = id;
    msgDiv.className = `message ${className}`;
    msgDiv.innerHTML = `<strong>${sender}:</strong><br>${text}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('You', text, 'user-msg');
    chatInput.value = '';

    const loadingId = 'loading_' + Date.now();
    appendMessage('Broccoli 2.0', 'Thinking...', 'bot-msg', loadingId);

    try {
      chatHistory.push({ role: 'user', content: text });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitor_id: visitorId,
          history: chatHistory
        })
      });

      const data = await response.json();
      document.getElementById(loadingId).remove();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const botReply = data.reply || "I couldn't generate a reply right now.";

      chatHistory.push({ role: 'assistant', content: botReply });

      appendMessage(
        'Broccoli',
        botReply,
        'bot-msg'
      );
    } catch (err) {
      document.getElementById(loadingId).remove();
      appendMessage('System', err.message || 'Failed to reach server.', 'system-msg');
    }
  }

  broccoliBtn.addEventListener('click', () => {
    chatSidebarOpen = true;
    sidebar.style.right = '0';
    if (popup) popup.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    chatSidebarOpen = false;
    sidebar.style.right = `-${sidebar.offsetWidth}px`;
  });

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

handleHackatimeCallback();
loadPublicHackatimeStats();
