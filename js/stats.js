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

    const token = localStorage.getItem("hackatime_access_token");

    if (!token) {
      document.getElementById("project-count").textContent = "Login required";
      renderProjects([]);
      await loadActivityHeatmap();
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
      console.error("Failed to load projects:", error);
      document.getElementById("project-count").textContent =
        error.status === 401 ? "Login required" : "Unavailable";
    }

    document.getElementById("project-count").textContent = matchingProjects.length;
    renderProjects(matchingProjects);

    await loadActivityHeatmap();
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
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

async function loadActivityHeatmap() {
  const container = document.getElementById("activity-heatmap");
  if (!container) return;

  const token = localStorage.getItem("hackatime_access_token");

  if (!token) {
    container.innerHTML = "<p>Connect Hackatime to view daily activity.</p>";
    return;
  }

  const days = 84;
  const today = new Date();
  const requests = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = date.toISOString().split("T")[0];

    requests.push(
      fetchJSON(`${AUTH_API}/hours?start_date=${iso}&end_date=${iso}`)
        .then(data => ({
          date: iso,
          seconds: data.total_seconds || 0,
          unauthorized: false
        }))
        .catch(error => ({
          date: iso,
          seconds: 0,
          unauthorized: error.status === 401
        }))
    );
  }

  const activity = await Promise.all(requests);

  if (activity.some(day => day.unauthorized)) {
    container.innerHTML = "<p>Reconnect Hackatime to view daily activity.</p>";
    return;
  }

  const maxSeconds = Math.max(...activity.map(day => day.seconds), 1);

  container.innerHTML = "";

  const totalWeeks = 12;
  for (let w = 0; w < totalWeeks; w++) {
    const weekDiv = document.createElement("div");
    weekDiv.className = "heatmap-week";

    for (let d = 0; d < 7; d++) {
      const index = w * 7 + d;
      const day = activity[index];
      if (!day) continue;

      const cell = document.createElement("div");
      cell.className = "heatmap-day";

      let level = 0;
      if (day.seconds > 0) {
        const ratio = day.seconds / maxSeconds;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else level = 1;
      }

      cell.classList.add(`level-${level}`);
      cell.title = `${day.date} — ${(day.seconds / 3600).toFixed(1)} hrs`;

      weekDiv.appendChild(cell);
    }
    container.appendChild(weekDiv);
  }
}

loadStats();
