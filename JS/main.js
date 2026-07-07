// types.js

new Typed("#element", {
    strings: [
        "AI/ML Engineering",
        "Embedded Systems Developeing",
        "IOT Engineering","yapper"
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

// ================================================
// Mouse Position
// ================================================

dock.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;

});

dock.addEventListener("mouseleave", () => {

    mouseX = Infinity;

});

// ================================================
// Calculate Targets
// ================================================

function updateTargets() {

    state.forEach(obj => {

        const rect = obj.element.getBoundingClientRect();

        const center = rect.left + rect.width / 2;

        const distance = mouseX - center;

        const abs = Math.abs(distance);

        let influence = 0;

        if (abs < MAGNETIC_DISTANCE) {

            influence = 1 - abs / MAGNETIC_DISTANCE;

        }

        obj.targetScale = lerp(
            1,
            MAX_SCALE,
            influence
        );

        obj.targetOffsetY =
            -10 * influence;

    });

}

// ================================================
// Spring Animation
// ================================================

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

    // ------------------------------
    // Dynamic Dock Size
    // ------------------------------

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

    // ------------------------------
    // Keep dock perfectly centered
    // ------------------------------

    dock.parentElement.style.left = "50%";
    dock.parentElement.style.transform = "translateX(-50%)";

    // ------------------------------
    // Position icons
    // ------------------------------

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

// ================================================
// Click Active State
// ================================================

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

// ======================================================
// PART 2
// MacOS Neighbor Wave + Scroll Spy + Hover Glow
// ======================================================

// --------------------------------------
// Better influence curve
// --------------------------------------

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

    // ----------------------------------
    // Neighbor wave (Mac Dock effect)
    // ----------------------------------

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

// ======================================================
// Hover Glow
// ======================================================

items.forEach(item => {

    item.addEventListener("mouseenter", () => {

        item.style.boxShadow =

            `
        0 10px 35px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.75),
        0 0 28px rgba(255,255,255,.10)
        `;

    });

    item.addEventListener("mouseleave", () => {

        item.style.boxShadow =

            `
        0 6px 15px rgba(0,0,0,.25),
        inset 0 1px 0 rgba(255,255,255,.55)
        `;

    });

});

// ======================================================
// Scroll Spy
// ======================================================

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

// ======================================================
// Active Dot
// ======================================================

function updateDots() {

    items.forEach(item => {

        const dot =
            item.querySelector(".active-dot");

        if (!dot) return;

        if (item.classList.contains("active")) {

            dot.style.opacity = "1";

            dot.style.transform = "scale(1)";

        }

        else {

            dot.style.opacity = "0";

            dot.style.transform = "scale(.2)";

        }

    });

}

updateDots();

items.forEach(item => {

    item.addEventListener("click", () => {

        setTimeout(updateDots, 20);

    });

});

// ======================================================
// Small Floating Idle Animation
// ======================================================

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

// ======================================================
// PART 3
// Componentry SVG Icons + Shine + Active Animation
// ======================================================

// ---------- SVG ICONS ----------

const SVG_ICONS = {

    home: `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
<polyline points="9 22 9 12 15 12 15 22"/>
</svg>
`,

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

// =======================================
// Inject Icons
// =======================================

items.forEach(item => {

    const icon = item.querySelector(".dock-icon");

    const key = item.dataset.section;

    if (SVG_ICONS[key]) {

        icon.innerHTML = SVG_ICONS[key];

    }

});

// =======================================
// Shine Overlay
// =======================================

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

// =======================================
// Active Animation
// =======================================

items.forEach(item => {

    item.addEventListener("click", () => {

        item.animate(

            [

                {
                    transform: item.style.transform
                },

                {
                    transform: item.style.transform + " scale(.92)"
                },

                {
                    transform: item.style.transform
                }

            ],

            {

                duration: 220,

                easing: "ease-out"

            });

    });

});

// =======================================
// Mouse Leave Reset
// =======================================

dock.addEventListener("mouseleave", () => {

    state.forEach(obj => {

        obj.targetScale = 1;

        obj.targetOffsetY = 0;

    });

});

// =======================================
// END OF PART 3
// =======================================