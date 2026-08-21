import os
import json
import smtplib
from email.message impott EmailMessage
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai #using google genai sdk

app = FastApI(title="Broccoli 2")


