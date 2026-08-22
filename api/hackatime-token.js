const HACKATIME_TOKEN_URL =
  "https://hackatime.hackclub.com/oauth/token";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      code,
      code_verifier,
      redirect_uri,
      client_id
    } = req.body;

    const response = await fetch(HACKATIME_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id,
        code_verifier
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Hackatime token exchange failed",
        details: text
      });
    }

    const tokenData = JSON.parse(text);
    return res.status(200).json(tokenData);

  } catch (error) {
    return res.status(500).json({
      error: "Token exchange failed",
      details: error.message
    });
  }
}
