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
  const token =
    localStorage.getItem("hackatime_access_token");

  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function loadStats() {
  const params = new URLSearchParams(window.location.search);
  const selectedLanguage = params.get("language");

  if (!selectedLanguage) return;

  try {
    // LANGUAGE TOTAL

    const summary = await fetchJSON(SUMMARY_API);

    const apiLanguage =
      languageMap[selectedLanguage] || selectedLanguage;

    const languageData = summary.languages.find(
      language =>
        language.key.toLowerCase() ===
        apiLanguage.toLowerCase()
    );

    const hours = languageData
      ? languageData.total / 3600
      : 0;

    document.getElementById("stats-language").textContent =
      selectedLanguage;

    document.getElementById("total-hours").textContent =
      `${hours.toFixed(1)} hrs`;



    // PROJECTS

    const token = localStorage.getItem("hackatime_access_token");

    if (!token) {
      document.getElementById("project-count").textContent = "Login required";
      renderProjects([]);
      await loadActivityHeatmap();
      return;
    }

    const projectsData =
      await fetchJSON(`${AUTH_API}/projects`);

    const matchingProjects =
      (projectsData.projects || []).filter(project => {
        const projectLanguages = getProjectLanguages(project);

        return projectLanguages.some(language =>
          language.toLowerCase() === apiLanguage.toLowerCase()
        );
      });

    document.getElementById("project-count").textContent =
      matchingProjects.length;

    renderProjects(matchingProjects);



    // ACTIVITY


    await loadActivityHeatmap();

  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

function getProjectLanguages(project) {
  if (Array.isArray(project.languages)) {
    return project.languages
      .map(language =>
        typeof language === "string"
          ? language
          : language.name || language.key
      )
      .filter(Boolean);
  }

  if (project.languages && typeof project.languages === "object") {
    return Object.keys(project.languages);
  }

  return project.language ? [project.language] : [];
}


// pROJECTS

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
    .sort((a, b) => getProjectSeconds(b) - getProjectSeconds(a))
    .forEach(project => {

      const card =
        document.createElement("article");

      card.className = "stats-project";

      const hours = getProjectSeconds(project) / 3600;

      const projectLanguages = getProjectLanguages(project);

      card.innerHTML = `
        <div>
          <h3>${project.name}</h3>
          <p>${hours.toFixed(1)} hrs total project time</p>
        </div>

        <span>
          ${projectLanguages.join(" · ")}
        </span>
      `;

      container.appendChild(card);
    });
}

function getProjectSeconds(project) {
  return Number(project.total_seconds ?? project.total ?? 0);
}

// dAILY ACTIVITY HEATMAP

async function loadActivityHeatmap() {

  const token =
    localStorage.getItem("hackatime_access_token");

  const container =
    document.getElementById("activity-heatmap");

  if (!token) {
    container.innerHTML =
      "<p>Connect Hackatime to view daily activity.</p>";
    return;
  }

  const days = 84;

  const today =
    new Date();

  const requests = [];

  for (let i = days - 1; i >= 0; i--) {

    const date =
      new Date(today);

    date.setDate(
      today.getDate() - i
    );

    const iso =
      date.toISOString().split("T")[0];

    requests.push(
      fetchJSON(
        `${AUTH_API}/hours?start_date=${iso}&end_date=${iso}`
      ).then(data => ({
        date: iso,
        seconds: data.total_seconds || 0
      }))
    );
  }

  const activity =
    await Promise.all(requests);

  const maxSeconds =
    Math.max(
      ...activity.map(day => day.seconds),
      1
    );

  container.innerHTML = "";

  activity.forEach(day => {

    const cell =
      document.createElement("div");

    const intensity =
      day.seconds / maxSeconds;

    cell.className = "activity-cell";

    cell.style.opacity =
      day.seconds === 0
        ? "0.12"
        : String(0.25 + intensity * 0.75);

    cell.title =
      `${day.date} — ${(day.seconds / 3600).toFixed(1)} hrs`;

    container.appendChild(cell);
  });
}


loadStats();

/
function renderHeatmap() {
  const container = document.getElementById("activity-heatmap");
  if (!container) return;

  container.innerHTML = "";
  const totalWeeks = 12;
  const daysPerWeek = 7;

  for (let w = 0; w < totalWeeks; w++) {
    const weekDiv = document.createElement("div");
    weekDiv.className = "heatmap-week";

    for (let d = 0; d < daysPerWeek; d++) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "heatmap-day";

      const randomLevel = Math.floor(Math.random() * 5);
      dayDiv.classList.add(`level-${randomLevel}`);
      dayDiv.title = `Activity Level: ${randomLevel}`;

      weekDiv.appendChild(dayDiv);
    }
    container.appendChild(weekDiv);
  }
}
