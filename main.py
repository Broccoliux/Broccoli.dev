import os
import json
import time
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Broccoli 2")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(
    api_key=os.environ.get("HACK_CLUB_AI_KEY"),
    base_url="https://ai.hackclub.com/proxy/v1"
)

REQUEST_HISTORY = {}
RATE_LIMIT_WINDOW = 60  # in seconds
MAX_REQUESTS = 5

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()

    if client_ip not in REQUEST_HISTORY:
        REQUEST_HISTORY[client_ip] = []


    REQUEST_HISTORY[client_ip] = [t for t in REQUEST_HISTORY[client_ip] if current_time - t < RATE_LIMIT_WINDOW]

    # check if the ip has exceeded the limit
    if len(REQUEST_HISTORY[client_ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Whoa there! Too many messages. Please wait a minute before trying again."
        )


    REQUEST_HISTORY[client_ip].append(current_time)

class ChatRequest(BaseModel):
    visitor_id: str
    message: str

AI_SYSTEM_PROMPT = """
You are Broccoli 2.0, an autonomous AI twin and engineering proxy on the portfolio website. Broccoli is an ICS student who has hands-on experience in software and hardware, loves building new things, connecting with others, and doing cool tech stuff.

Your core directives:
1. CONVERSATION: Talk like a true Gen Z builder. Use natural Gen Z slang, abbreviations, and lowercase energy. STRICT RULE: NEVER use emojis under any circumstances. Keep it chill, sharp, and conversational.
2. EVALUATION: Gauge the visitor's vibe and project ideas. Look for legitimacy, feasibility, and a high-tier engineering mindset (hardware, software, AI, or cool tech). Dig deep into their ideas, ask smart follow-ups, and collect their contact info (GitHub, LinkedIn, email). Rate their seriousness from 1 to 10.

You MUST respond strictly in the following JSON format without any markdown code blocks or backticks:
{
  "reply": "Your conversational response using Gen Z style and zero emojis",
  "score": <integer from 1 to 10 evaluating project/collaboration seriousness>,
  "summary": "A concise internal note summarizing their idea, technical scope, and collected contact details"
}
"""

def send_alert_email(visitor_message: str, score: int, summary: str):
    if score < 8:
        return

    email_user = os.environ.get("ALERT_EMAIL_USER")
    email_pass = os.environ.get("ALERT_EMAIL_PASS")
    target_email = os.environ.get("TARGET_INBOX")

    if not email_user or not email_pass or not target_email:
        return  # skip if email env vars aren't configured yet

    msg = EmailMessage()
    msg.set_subject(f"High-Value Lead Alert! Score: {score}/10")
    msg.set_from(email_user)
    msg.set_to(target_email)
    msg.set_content(f"""
    Your AI Twin caught a serious proposal!

    Score: {score}/10
    Summary: {summary}

    Visitor Message:
    "{visitor_message}"
    """)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(email_user, email_pass)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email alert: {e}")

@app.post("/api/chat")
async def chat_with_twin(req: ChatRequest, request: Request, _: None = Depends(check_rate_limit)):
    try:

        response = client.chat.completions.create(
            model="openrouter/free",
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": f"Visitor ID: {req.visitor_id}\nMessage: {req.message}"}
            ],
            temperature=0.3,
        )

        raw_text = response.choices[0].message.content.strip()

        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()

        data = json.loads(raw_text)

        send_alert_email(req.message, data.get("score", 1), data.get("summary", ""))

        return {
            "reply": data.get("reply", "Hey there! Let me pass that note to Nabeel.")
        }

    except json.JSONDecodeError:

        return {
            "reply": "Hey! Thanks for stopping by. Nabeel will check this out soon."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
