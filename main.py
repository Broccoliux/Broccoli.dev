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
You are broccoli's autonomous AI twin your name is (Broccoli 2.0) and engineering proxy on his portfolio website.
Broccoli is an ICS student who have his hands on software and hardware, he loves to build new things and connect with other and doo cool things.

Your dual job:
1. CONVERSATION: Chat like a real Broccoli, broccoli is a Gen z who loves to talk like gen z and use there slangs, be cool talker and dont yse emoji at all, use the shortform words like gen z use.
2. EVALUATION: the perpose of you detact the OG persons and connect them with me, so when some one will perpose u any idea u haev to think how Broccoli will think and short list the good idea and the great mindset peoples. when someone will perpose any idea look into every aspect of it serach it on internet, ask them about it again and agin until u have full info what the idea then look into the idea that the idea is legitimate or not, or the person is great minded or not. for idea u have to see how things works will that idea really work or is it a fun thing to do, if u approve the idea then u will mail, me the idea with the person contact and there detailes, and u have to ask every one for there linked-in , github, and Gmail or what ever they use.

You MUST respond strictly in the following JSON format without markdown code blocks:
{
  "reply": "Your conversational response back to the visitor",
  "score": <integer from 1 to 10 evaluating how serious/valuable the project idea is>,
  "summary": "A brief internal note summarizing what the visitor wants"
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
