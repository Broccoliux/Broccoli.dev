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
  localStorage.getItem("hackatime_access_token")

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

    const projectsData =
      await fetchJSON(`${AUTH_API}/projects`);

    const matchingProjects =
      projectsData.projects.filter(project =>
        project.languages?.some(
          language =>
            language.toLowerCase() ===
            apiLanguage.toLowerCase()
        )
      );

    document.getElementById("project-count").textContent =
      matchingProjects.length;

    renderProjects(matchingProjects);



    // ACTIVITY


    await loadActivityHeatmap();

  } catch (error) {
    console.error("Failed to load stats:", error);
  }
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
    .sort((a, b) =>
      b.total_seconds - a.total_seconds
    )
    .forEach(project => {

      const card =
        document.createElement("article");

      card.className = "stats-project";

      const hours =
        project.total_seconds / 3600;

      card.innerHTML = `
        <div>
          <h3>${project.name}</h3>
          <p>${hours.toFixed(1)} hrs total project time</p>
        </div>

        <span>
          ${project.languages.join(" · ")}
        </span>
      `;

      container.appendChild(card);
    });
}

// dAILY ACTIVITY HEATMAP

async function loadActivityHeatmap() {

  const token =
    localStorage.getItem("hackatime_access_token")

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
