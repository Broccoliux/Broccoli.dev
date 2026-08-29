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

### Requirments

- Node.js 18 or newer is recommended because the server code uses the built in `fetch` API.
- A static web server for the frontend.
- Enviroment variables for the server side features(see below).

# Made my Broccoli for Broccoli.
