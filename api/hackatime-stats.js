const HACKATIME_API =
  "https://hackatime.hackclub.com/api/v1/authenticated";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const response = await fetch(
      `${HACKATIME_API}/projects`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.HACKATIME_ACCESS_TOKEN}`
        }
      }
    );

    const text = await response.text();

    return res.status(200).json({
      hackatime_status: response.status,
      hackatime_response: text
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
