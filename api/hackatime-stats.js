const HACKATIME_API =
  "https://hackatime.hackclub.com/api/v1/authenticated";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  return res.status(200).json({
    message: "Hackatime stats API is working"
  });
}
