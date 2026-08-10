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

    const 



  }
}
