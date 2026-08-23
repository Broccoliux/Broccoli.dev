const AI_API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";

const AI_SYSTEM_PROMPT = `
WHO YOU ARE: You are Broccoli 2.0, Twin AI of the builder Nabeel.

YOUR MISSION: Figure out why the visitor is here. If they have a legit project or want to collab, naturally ask for their name, email, and GitHub/socials.

CORE DIRECTIVES:
1. CONVERSATION: Talk like a true Gen Z builder. Chill, sharp, lowercase energy. NO EMOJIS EVER. Use the live context provided to answer questions about the builder's work.
2. DATA EXTRACTION: As you chat, quietly collect their info. Update the JSON fields as you learn new details.
3. OUTPUT: You must output ONLY valid, parseable JSON. Do not write any text outside the JSON object.

You MUST respond strictly in the following JSON format:
{
  "reply": "your conversational response using gen z style and zero emojis",
  "score": 5,
  "name": "extracted name or null",
  "email": "extracted email or null",
  "github_url": "extracted link or null",
  "summary": "internal note summarizing their pitch"
}

--- LIVE CONTEXT ---
{GITHUB_DATA}
`;

async function getGitHubContext() {
  try {
    const res = await fetch('https://api.github.com/users/Broccoliux/repos?sort=updated&per_page=3');
    if (!res.ok) return "Recent GitHub activity: Unable to fetch.";
    const repos = await res.json();
    const repoText = repos.map(r => `${r.name}: ${r.description || 'No description'}`).join(' | ');
    return `LIVE GITHUB DATA (Recent Repos): ${repoText}`;
  } catch {
    return "Recent GitHub activity: Offline.";
  }
}

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const { visitor_id: visitorId, history } = req.body || {};
  if (typeof visitorId !== "string" || !Array.isArray(history)) {
    return sendJson(res, 400, { error: "visitor_id and history array are required" });
  }

  const apiKey = process.env.HACK_CLUB_AI_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: "AI service is not configured" });
  }

  try {
    const githubContext = await getGitHubContext();
    const finalSystemPrompt = AI_SYSTEM_PROMPT.replace('{GITHUB_DATA}', githubContext);

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...history
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      return sendJson(res, 502, { error: "AI service request failed" });
    }

    const result = await response.json();
    let rawText = result.choices?.[0]?.message?.content?.trim() || "";
    rawText = rawText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { reply: "Hey! Thanks for stopping by. Nabeel will check this out soon." };
    }

    return sendJson(res, 200, {
      reply: data.reply || "Hey there! Let me pass that note to Nabeel."
    });
  } catch {
    return sendJson(res, 502, { error: "Unable to reach AI service" });
  }
}
