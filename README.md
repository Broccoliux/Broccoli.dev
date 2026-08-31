# Broccoli.dev

<img width="1355" height="685" alt="image" src="https://github.com/user-attachments/assets/cd463773-7961-463e-81cd-1623005d7013" />


----------------------------------------------------------------------------------------------------------------------------------------
Broccoli.dev is a personal portfolio of Broccoli, The site combines a space themed interactive homepage with project and achievement showcase, live Hacktime activity, and a AI powered Broccoli Twim (Broccoli 2.0).

## Why it is sooo coool

- Protfolio sections for intro, information, experience, achievements, skills, projects, and contact links.
- Cool interacttivebottom navigayte dock for moving between homepage sectiion.
- Meteors representing progamming languages.There are size are based on language hrs loged in Hacktime.
- Project cards with Cool glass effect, and Hacktime project hrs.
- A cool nerdy Achievement Page.
- Langauge specific activity page.
- Cool Twin of Broccoli, (broccoli 2.0).
- GitHub context lookup for Broccoli repositories and, when supplied, a visitors public GitHub profile and repositories.
- Broccoli twin have power to save visitor Info if provided, in google sheets and aleart mail to Broccoli.

## Project Structure

    .
    ├── index.html                 Main portfolio page
    ├── achievements.html          Full achievements page
    ├── stats.html                 Language activity page
    ├── css/
    │   ├── style.css              Shared and homepage styles
    │   └── stats.css              Stats-page styles
    ├── js/
    │   ├── main.js                Homepage interactions and API calls
    │   └── stats.js               Stats-page data laoding and rendering
    ├── api/
    │   ├── chat.js                AI chat, Github lookup, sheets, and email
    │   ├── hackatime-stats.js     Server-side Hackatime project filtering
    │   └── hackatime-token.js     Hackatime OAuth token exchange
    ├── img_assets/                Portfolio, achievement, and space images
    ├── package.json               Server dependency manifest
    ├── package-lock.json          Locked dependency versions
    ├── .gitignore                 Ignores local secrets such as `.env`
    └── README.md                  Project documentation


## Technoloia

- HTML for page structure and content.
- CSS for layout, responsive behavior, glass effects, animations and the Block space Void themed presentation.
- Browser JavaScript for interactions and rendering.
- Typed.js for animated hero text.
- Hacktime APIs for public language summaries and authenticated project data.
- Hack Clubs Ai proxy using the `openrouter/free` model for the Broccoli twin.
- Github public API for repository context.


## Local setup

### Requirements

- Node.js 18 or newer
- npm
- A local dev server that can run the API routes under `api/`

### Install dependencies

```bash
npm install
```

### Add the API keys in Vercel

Store these values in your Vercel project environment variables, not in a local `.env` file:

```bash
HACK_CLUB_AI_KEY=your_ai_key_here
GITHUB_TOKEN=your_github_token_here
SHEET_WEB_APP_URL=https://script.google.com/macros/s/your-sheet-web-app/exec
RESEND_API_KEY=your_resend_api_key
NOTIFICATION_EMAIL=you@example.com
HACKATIME_CLIENT_ID=your_hackatime_client_id
HACKATIME_REDIRECT_URI=http://localhost:3000/
HACKATIME_ACCESS_TOKEN=your_hackatime_token
```

### Run locally

```bash
npx vercel dev
```

Then open the local URL shown in the terminal, usually:

```bash
http://localhost:3000
```

This starts the frontend and loads the server routes in `api/` with the environment variables from Vercel.

### If you only want to preview the static front-end

```bash
npx serve .
```

This works for the HTML pages, but the AI chat, Hackatime auth, and lead capture features will not work without the Vercel API environment setup.

# Made my Broccoli for Broccoli.

U like it? Star it.
