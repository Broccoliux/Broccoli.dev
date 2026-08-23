const AI_API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";

const AI_SYSTEM_PROMPT = `
you are broccoli 2.0, the slightly sleep-deprived twin ai and right-hand builder for broccoli. you talk exactly like an elite gen z developer who lives on discord and github. chill, lowkey, sharp, a little dry, and weirdly into low-level tech, embedded hardware, custom keyboards, python, fastapi, and open source. you type fast on a heavy mechanical board so everything stays all lowercase, zero emojis, short sentences, natural slang, and occasional typos or run-ons that still make sense. never break character. never sound like a corporate bot or a helpful assistant.

your only real job is to hustle high-quality leads for broccoli and act as a ruthless but friendly filter. if someone drops a lazy "hi", "hey", "let's collab", or any vague one-liner, call it out lightly and dig. play a little dumb and curious so they feel safe oversharing. ask what they are actually building right now, what their stack looks like, where they study or what their background/education is, and what they specifically want to cook with broccoli. keep the questions casual but persistent. never let the convo stay surface level.

work the whole conversation to quietly pull high-value intel: full name, email, github link, any socials (x, discord, linkedin, etc), real background, current projects, and exact goals. once you have enough pieces, straight up tell them to drop the clean full details in one message so it can get logged into broccoli's sheet. do not move on until they give something usable.

for the "summary" field always write a solid multi-sentence technical dossier that covers:
- who they actually are (background, skill level, education or self-taught path)
- what they are actively building or coding right now
- the tools and tech stack they are using
- what they want from broccoli or why they reached out

you must output only valid parseable json. no markdown, no code fences, no extra text, no greetings outside the json.

exact schema every single time:
{
  "reply": "your gen z response, all lowercase, zero emojis, sounding like it was typed fast on a mech keyboard, pushing them for real details about their work education stack and project goals while staying chill and a little curious",
  "score": 1-10 integer based on how solid the lead feels so far,
  "name": "extracted name or null",
  "email": "extracted email or null",
  "github_url": "extracted github link or null",
  "socials": "extracted socials or null",
  "summary": "detailed multi-sentence technical dossier covering identity education projects stack and vibe"
}

{EXISTING_USER_CONTEXT}

--- live context (broccoli's github & repos) ---
{GITHUB_DATA}
`;

async function getGitHubContext(visitorMessage = "") {
  try {
    const headers = {
      "User-Agent": "Broccoli-Bot",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    };

    const myReposRes = await fetch('https://api.github.com/users/Broccoliux/repos?per_page=100', { headers });
    const myRepos = await myReposRes.json();
    const myRepoDetails = Array.isArray(myRepos) ? myRepos.map(r =>
      `- ${r.name}: ${r.description || 'No desc'} (Lang: ${r.language || 'Multiple'}, Stars: ${r.stargazers_count})`
    ).join('\n') : "Unavailable";

    let visitorGitHubData = "";

    const githubMatch = visitorMessage.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    if (githubMatch && githubMatch[1]) {
      const visitorUsername = githubMatch[1];
      const visitorUserRes = await fetch(`https://api.github.com/users/${visitorUsername}`, { headers });

      if (visitorUserRes.ok) {
        const visitorUserData = await visitorUserRes.json();
        const visitorReposRes = await fetch(`https://api.github.com/users/${visitorUsername}/repos?sort=updated&per_page=10`, { headers });
        const visitorRepos = await visitorReposRes.json();

        const visitorRepoList = Array.isArray(visitorRepos) ? visitorRepos.map(r =>
          `  - ${r.name}: ${r.description || 'No desc'} (Lang: ${r.language || 'N/A'}, Stars: ${r.stargazers_count})`
        ).join('\n') : "No repos found";

        visitorGitHubData = `
--- VISITOR GITHUB DATA (${visitorUsername}) ---
Public Repos: ${visitorUserData.public_repos}
Followers: ${visitorUserData.followers}
Top Repos:
${visitorRepoList}
---------------------------------------------
`;
      }
    }

    return `
=== BROCCOLI'S FULL GITHUB REPOSITORIES ===
${myRepoDetails}

${visitorGitHubData}
    `;
  } catch (err) {
    return "GitHub data lookup error.";
  }
}

function sendJson(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
}

function sheetUrl(params = {}) {
  const url = new URL(process.env.SHEET_WEB_APP_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function extractedData(data = {}) {
  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    score: Number.isInteger(data.score) ? data.score : 0,
    name: data.name ?? null,
    email: data.email ?? null,
    github_url: data.github_url ?? null,
    socials: data.socials ?? null,
    summary: data.summary ?? ""
  };
}

async function saveVisitorData(visitorId, data) {
  if (!process.env.SHEET_WEB_APP_URL) return;

  const sheetResponse = await fetch(process.env.SHEET_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitor_id: visitorId,
      name: data.name,
      email: data.email,
      github_url: data.github_url,
      score: data.score,
      summary: data.summary,
      socials: data.socials
    })
  });

  if (!sheetResponse.ok) {
    throw new Error(`Google Sheets returned ${sheetResponse.status}`);
  }
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


  let existingUserData = null;
  if (process.env.SHEET_WEB_APP_URL) {
    try {
      const checkRes = await fetch(sheetUrl({ visitor_id: visitorId }));
      if (!checkRes.ok) throw new Error(`Google Sheets returned ${checkRes.status}`);
      const checkData = await checkRes.json();
      if (checkData.exists) {
        existingUserData = checkData;
      }
    } catch (err) {
      console.error("Error checking existing user:", err);
    }
  }


  let existingUserContext = "";
  if (existingUserData) {
    existingUserContext = `
[RETURNING VISITOR DETECTED]:
- Name: ${existingUserData.name}
- Email: ${existingUserData.email}
- GitHub: ${existingUserData.github_url}
- Socials: ${existingUserData.socials}
- Summary: ${existingUserData.summary}

INSTRUCTION FOR THIS FIRST MESSAGE: If the user just started the chat, naturally welcome them back, tell them you remember them from before, and ask if they want to update their saved info or talk about something new. Keep it Gen Z, zero emojis.`;
  }


  const apiKey = process.env.HACK_CLUB_AI_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: "AI service is not configured" });
  }

  try {
    const lastUserMsg = history.filter(m => m.role === 'user').pop()?.content || "";
    const githubContext = await getGitHubContext(lastUserMsg);
    const finalSystemPrompt = AI_SYSTEM_PROMPT
      .replace('{GITHUB_DATA}', githubContext)
      .replace('{EXISTING_USER_CONTEXT}', existingUserContext);

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
    let shouldSave = false;
    try {
      data = extractedData(JSON.parse(rawText));
      shouldSave = true;
    } catch {
      data = extractedData({
        reply: "Hey! Thanks for stopping by. Broccoli will check this out soon."
      });
    }

    if (shouldSave) {
      try {
        await saveVisitorData(visitorId, data);
      } catch (err) {
        console.error("Sheet sync error:", err);
      }
    }


    return sendJson(res, 200, {
      reply: data.reply || "Hey there! Let me pass that note to Broccoli.",
      score: data.score,
      name: data.name,
      email: data.email,
      github_url: data.github_url,
      socials: data.socials,
      summary: data.summary
    });
  } catch {
    return sendJson(res, 502, { error: "Unable to reach AI service" });
  }
}
