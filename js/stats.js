const API_URL = "/api/hackatime-stats";

const languageMap = {
  "JAVA SCRIPT": "JavaScript",
  "BASH TERMINAL": "Shell",
  "TYPE SCRIPT": "TypeScript",
  "FREE CAD": "FreeCAD"
};

async function loadStats() {
  const params = new URLSearchParams(window.location.search);
  const selectedLanguage = params.get("language");

  if (!selectedLanguage) return;

  try {
    const apiLanguage =
      languageMap[selectedLanguage] || selectedLanguage;

    const response = await fetch(
      `${API_URL}?language=${encodeURIComponent(apiLanguage)}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const projects = data.projects || [];

    const totalSeconds = projects.reduce(
      (total, project) =>
        total + Number(project.total_seconds || 0),
      0
    );

    const hours = totalSeconds / 3600;

    document.getElementById("stats-language").textContent =
      selectedLanguage;

    document.getElementById("total-hours").textContent =
      `${hours.toFixed(1)} hrs`;

    document.getElementById("project-count").textContent =
      projects.length;

    renderProjects(projects);

  } catch (error) {
    console.error("Failed to load stats:", error);

    document.getElementById("project-count").textContent =
      "Unavailable";

    renderProjects([]);
  }
}

function renderProjects(projects) {
  const container =
    document.getElementById("language-projects");

  container.innerHTML = "";

  if (!projects.length) {
    container.innerHTML =
      "<p>No tracked projects found for this language.</p>";
    return;
  }

  projects
    .sort(
      (a, b) =>
        Number(b.total_seconds || 0) -
        Number(a.total_seconds || 0)
    )
    .forEach(project => {

      const card = document.createElement("article");
      card.className = "stats-project";

      const hours =
        Number(project.total_seconds || 0) / 3600;

      card.innerHTML = `
        <div>
          <h3>${project.name}</h3>
          <p>${hours.toFixed(1)} hrs total project time</p>
        </div>

        <span>
          ${(project.languages || []).join(" · ")}
        </span>
      `;

      container.appendChild(card);
    });
}

loadStats();
