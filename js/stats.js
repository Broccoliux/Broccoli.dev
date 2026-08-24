const SUMMARY_API =
  "https://hackatime.hackclub.com/api/summary?user_id=U0ASNE2V58Q&interval=all_time";

const AUTH_API =
  "https://hackatime.hackclub.com/api/v1/authenticated";

const languageMap = {
  "JAVA SCRIPT": "JavaScript",
  "BASH TERMINAL": "Shell",
  "TYPE SCRIPT": "TypeScript",
  "FREE CAD": "FreeCAD"
};

async function fetchJSON(url) {
  const token = localStorage.getItem("hackatime_access_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = new Error(`${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function loadStats() {
  const params = new URLSearchParams(window.location.search);
  const selectedLanguage = params.get("language");

  if (!selectedLanguage) return;

  try {
    const summary = await fetchJSON(SUMMARY_API);
    const apiLanguage = languageMap[selectedLanguage] || selectedLanguage;

    const languageData = summary.languages.find(
      language => language.key.toLowerCase() === apiLanguage.toLowerCase()
    );

    const hours = languageData ? languageData.total / 3600 : 0;

    document.getElementById("stats-language").textContent = selectedLanguage;
    document.getElementById("total-hours").textContent = `${hours.toFixed(1)} hrs`;

    let activeDaysCount = 0;
    if (summary.days && Array.isArray(summary.days)) {
      activeDaysCount = summary.days.filter(day => {
        if (!day.languages) return false;
        return day.languages.some(l =>
          (l.key || l.name || "").toLowerCase() === apiLanguage.toLowerCase()
        );
      }).length;
    }

    const activeDaysEl = document.getElementById("active-days");
    if (activeDaysEl) {
      activeDaysEl.textContent = activeDaysCount;
    }

    const token = localStorage.getItem("hackatime_access_token");

    if (!token) {
      document.getElementById("project-count").textContent = "Login required";
      renderProjects([]);
      return;
    }

    let matchingProjects = [];

    try {
      const projectsData = await fetchJSON(`${AUTH_API}/projects`);
      matchingProjects = (projectsData.projects || []).filter(project => {
        const projectLanguages = getProjectLanguages(project);
        return projectLanguages.some(
          language => language.toLowerCase() === apiLanguage.toLowerCase()
        );
      });
    } catch (error) {
      document.getElementById("project-count").textContent =
        error.status === 401 ? "Login required" : "Unavailable";
    }

    document.getElementById("project-count").textContent = matchingProjects.length;
    renderProjects(matchingProjects);

  } catch { }
}

function getProjectLanguages(project) {
  if (Array.isArray(project.languages)) {
    return project.languages
      .map(language =>
        typeof language === "string" ? language : language.name || language.key
      )
      .filter(Boolean);
  }

  if (project.languages && typeof project.languages === "object") {
    return Object.keys(project.languages);
  }

  return project.language ? [project.language] : [];
}

function renderProjects(projects) {
  const container = document.getElementById("language-projects");
  container.innerHTML = "";

  if (!projects.length) {
    container.innerHTML = "<p>No tracked projects found for this language.</p>";
    return;
  }

  projects
    .sort((a, b) => getProjectSeconds(b) - getProjectSeconds(a))
    .forEach(project => {
      const card = document.createElement("article");
      card.className = "stats-project";

      const hours = getProjectSeconds(project) / 3600;
      const projectLanguages = getProjectLanguages(project);

      card.innerHTML = `
        <div>
          <h3>${project.name}</h3>
          <p>${hours.toFixed(1)} hrs total project time</p>
        </div>
        <span>${projectLanguages.join(" · ")}</span>
      `;

      container.appendChild(card);
    });
}

function getProjectSeconds(project) {
  return Number(project.total_seconds ?? project.total ?? 0);
}


loadStats();
