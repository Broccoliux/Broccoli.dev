const HACKATIME_TOKEN_URL =
  "https://hackatime.hackclub.com/oauth/token";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { code, code_verifier } = req.body || {};

    if (
      typeof code !== "string" ||
      typeof code_verifier !== "string" ||
      code.length > 2000 ||
      code_verifier.length > 200
    ) {
      return res.status(400).json({
        error: "Invalid OAuth request"
      });
    }

    const response = await fetch(HACKATIME_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier,
        redirect_uri: process.env.HACKATIME_REDIRECT_URI,
        client_id: process.env.HACKATIME_CLIENT_ID
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Hackatime token exchange failed"
      });
    }

    const tokenData = JSON.parse(text);
    return res.status(200).json(tokenData);

  } catch (error) {
    console.error("Token exchange error:", error);

    return res.status(500).json({
      error: "Token exchange failed"
    });
  }
}
