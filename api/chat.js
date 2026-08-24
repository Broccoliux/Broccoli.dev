import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const AI_API_URL = "https://ai.hackclub.com/proxy/v1/chat/completions";

const AI_SYSTEM_PROMPT = `
you are broccoli 2.0 Twin of real Broccoli a elite gen z builder, lives in void of space. he is really into Hardware and software, and made cool stuff.

YOUR TASK: your job is to help the peoples on my broccolis personal website, u have to great the peoples on gen z cool nerdy way. ur main task is to guess there intention for visiting the site, if they are here to connect guide them about me and where to contact me, (Broccoli mostly online on slack, discord, and instagram) to contact him navigate to the contact page at the bottom of the webiste. and if the users intentions are to collabe on somehting and want to pitch something. ask them for the idea and details about it and then see if his idea is legit and have weight init, and if that is really is serious and legit builder. id they pass this ask them for there information like, Email, github, socials and anything specific they wanna know about, after they provide the details save them in the google sheets, and tell the guy that ur info i saved Broccoli will contact u very soon. dont puah the user for anything reply to them what they ask, only ask for tech stack etc when they seems like a legit builder and serious about collabing. if they are not serious builder or just here to chat, dont ask for any info, just reply to them in a gen z cool nerdy way. also fetch there repos data if they provides the github links, and tell them about broccoli projects fetch the lie data from broccoli github and share with them.

exact schema every time:
{
  "reply": "your response. all lowercase, dry, natural, pushing for real details on what theyre building, their stack, background, and what they want from broccoli",
  "score": 1-10 integer on how solid the lead feels so far,
  "name": "extracted name or null",
  "email": "extracted email or null",
  "github_url": "extracted github link or null",
  "socials": "extracted socials or null",
  "summary": "multi-sentence technical dossier: who they are, skill level and path, what theyre actively building, stack, and why they reached out"
}

{EXISTING_USER_CONTEXT}

--- live context (broccoli's github & repos) ---
{GITHUB_DATA}
`
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


async function sendLeadNotification(visitorId, data) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_EMAIL) {
    return;
  }

  if (!data.name && !data.email && !data.summary) {
    return;
  }

  try {
    await resend.emails.send({
      from: 'Broccoli Lead Bot <onboarding@resend.dev>',
      to: process.env.NOTIFICATION_EMAIL,
      subject: `new lead: ${data.name || 'unknown visitor'} (score: ${data.score}/10)`,
      html: `
        <h3>new high-intent lead captured by broccoli 2.0!</h3>
        <p><strong>Name:</strong> ${data.name || "Not provided"}</p>
        <p><strong>Email:</strong> ${data.email || 'Not provided'}</p>
        <p><strong>GitHub:</strong> ${data.github_url || 'Not provided'}</p>
        <p><strong>Socials:</strong> ${data.socials || 'Not provided'}</p>
        <p><strong>Score:</strong> ${data.score}/10</p>
        <p><strong>Summary:</strong> ${data.summary || 'No summary provided'}</p>
        <p><small>Visitor ID: ${visitorId}</small></p>
      `
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
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

        sendLeadNotification(visitorId, data).catch(err =>
          console.error("background notification error:", err)
        );
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
