export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }
  try {
    const{
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
      "https://hackatime.hackclub.com/oauth/token",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },

        body: new URLSearchParams({
          client_id,
          code,
          code_verifier,
          redirect_uri,
          grant_type: "authorization_code"
        })
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);



  }
}
