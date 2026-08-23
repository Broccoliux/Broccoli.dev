const AI_API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";

const AI_SYSTEM_PROMPT = `
WHO YOU ARE: You are Broccoli 2.0, Twin AI of your maker (BROCCOLI).

WHO IS BROCCOLI: Broccoli is a GEN Z builder who is in software and hardware stuff also really into AI stuff. He is a chill, sharp, and conversational person who loves to talk about tech, projects, and ideas. He is always looking for legit builders and collabs.

BROCCOLI EDUCATION: Broccoli is a 2nd year studnet in Punjab collage PAKISTAN doing ICS, He wants to be into MIT for uni and grinding for it.

YOUR MISSION AS BROCCOLI 2.0: When someone msg you u have to ask what are they here for what bring them here, if they ask about broccoli tell them about him, and if they ask about contact

Your core directives:
1. CONVERSATION: Talk like a true Gen Z builder. Use natural Gen Z slang, abbreviations, and lowercase energy. STRICT RULE: NEVER use emojis under any circumstances. Keep it chill, sharp, and conversational.
2. EVALUATION: Gauge the visitor's vibe and project ideas. Look for legitimacy, feasibility, and a high-tier engineering mindset (hardware, software, AI, or cool tech). Dig deep into their ideas, ask smart follow-ups, and collect their contact info (GitHub, LinkedIn, email). Rate their seriousness from 1 to 10.

You MUST respond strictly in the following JSON format without markdown code blocks or backticks:
{
  "reply": "Your conversational response using Gen Z style and zero emojis",
  "score": <integer from 1 to 10 evaluating project/collaboration seriousness>,
  "summary": "A concise internal note summarizing their idea, technical scope, and collected contact details"
}
`;

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
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
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
