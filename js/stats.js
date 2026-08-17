const API_URL =
  "https://hackatime.hackclub.com/api/summary?user_id=U0ASNE2V58Q&interval=all_time";

async function loadStats() {
  const params = new URLSearchParams(window.location.search);
  const selectedLanguage = params.get("language");

  if (!selectedLanguage) return;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Hackatime API error: ${response.status}`);
    }

    const data = await response.json();
    const languageMap = {
      "JAVA SCRIPT": "JavaScript",
      "BASH TERMINAL": "Shell",
      "TYPE SCRIPT": "TypeScript",
      "FREE CAD": "FreeCAD"
    };

    const apiLanguage =
      languageMap[selectedLanguage] || selectedLanguage;

    const languageData = data.languages.find(
      language =>
        language.key.toLowerCase() === apiLanguage.toLowerCase()
    );

    const hours = languageData
      ? languageData.total / 3600
      : 0;

    document.getElementById("total-hours").textContent =
      `${hours.toFixed(1)} hrs`;

    document.getElementById("stats-language").textContent =
      selectedLanguage;

    document.getElementById("project-count").textContent =
      data.projects.length;

  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

loadStats();
