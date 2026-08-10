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

    if (!code || !code_verifier || !redirect_uri || !client_id) {
      return res.status(400).json({
        error: "Missing required parameters"
      });
    }

    const response = await fetch(
      "https://broccoli-dev.vercel.app/api/hackatime-token",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: HACKATIME_REDIRECT_URI,
          client_id: HACKATIME_CLIENT_ID
        })
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {

    console.error("Hackatime token exchange failed:", error);
    return res.status(500).json({
      error: "Token exchange failed"
    });
  }
}
