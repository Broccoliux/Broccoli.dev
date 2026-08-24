const HACKATIME_API =
  "https://hackatime.hackclub.com/api/v1/authenticated";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const language = req.query.language;

    if (!language) {
      return res.status(400).json({
        error: "Language is required"
      });
    }

    const response = await fetch(
      `${HACKATIME_API}/projects`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.HACKATIME_ACCESS_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Hackatime request failed"
      });
    }

    const projects = (data.projects || []).filter(project =>
      project.languages?.some(
        lang =>
          lang.toLowerCase() === language.toLowerCase()
      )
    );

    return res.status(200).json({
      language,
      projects
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
