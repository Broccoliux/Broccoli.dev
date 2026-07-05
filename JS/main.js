// Typed.js Animation
var typed = new Typed('#element', {
    strings: ['AI/ML Engineer', 'IOT Engineer.', 'Embedded systems developer.'],
    typeSpeed: 50,
    backSpeed: 30,
    loop: true
});

// Magnetic Dock
const dockItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "about", label: "About", icon: "👨‍💻" },
    { id: "experience", label: "Experience", icon: "💼" },
    { id: "projects", label: "Projects", icon: "🚀" },
    { id: "skills", label: "Skills", icon: "⚡" },
    { id: "contact", label: "Contact", icon: "✉️" }
];

const dock = document.getElementById('magneticDock');

dockItems.forEach(item => {
    const dockItem = document.createElement('div');
    dockItem.className = 'dock-item';
    dockItem.innerHTML = `
        <span class="dock-label">${item.label}</span>
        <span style="font-size: 28px;">${item.icon}</span>
    `;
    
    dockItem.addEventListener('click', () => {
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        dockItem.classList.add('active');
        
        // Scroll to section (we'll create these sections later)
        const section = document.getElementById(item.id);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    });
    
    dock.appendChild(dockItem);
});