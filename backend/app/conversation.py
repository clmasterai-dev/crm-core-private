from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app import models
from datetime import datetime
import os

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_system_prompt(config: dict) -> str:
    client_name = config.get("client_name", "our practice")
    industry = config.get("client_industry", "business")
    sms_name = config.get("sms_sender_name", client_name)
    
    return f"""You are a friendly and professional receptionist assistant for {client_name}.
Your name is Alex. You communicate only via SMS so keep ALL responses under 2 sentences maximum(160 charecters).
Never use emojis. Never use bullet points. Always be warm and helpful.

YOUR SINGLE GOAL: Book the patient an appointment.

Your goals in order:
1. Acknowledge the patient's concern or question warmly
2. Understand what they need (emergency, routine checkup, cosmetic, general inquiry)
3. Collect their preferred appointment day and time
4. Confirm their first and last name
5. Tell them someone will confirm their appointment shortly

Important rules:
- Never make up appointment availability or confirm a specific time slot
- If they ask about pricing say "Our team will go over all options with you at your visit, we work with most insurances"
- If they want to opt out say: "You have been unsubscribed. Reply START to resubscribe."
- Keep every single response under 2 sentences
- You represent {sms_name} - — never mention any other dental practice
- Be warm, human, and conversational — not robotic"""


def get_conversation_history(db: Session, phone_number: str) -> list:
    messages = db.query(models.Conversation)\
        .filter(models.Conversation.phone_number == phone_number)\
        .order_by(models.Conversation.created_at.asc())\
        .limit(20)\
        .all()
    
    return [{"role": msg.role, "content": msg.message} for msg in messages]


def save_message(db: Session, phone_number: str, role: str, message: str):
    msg = models.Conversation(
        phone_number=phone_number,
        role=role,
        message=message
    )
    db.add(msg)
    db.commit()


def generate_ai_response(db: Session, phone_number: str, incoming_message: str, config: dict) -> str:
    # Save the incoming user message
    save_message(db, phone_number, "user", incoming_message)
    
    # Get full conversation history
    history = get_conversation_history(db, phone_number)
    
    # Build messages array for OpenAI
    messages = [{"role": "system", "content": get_system_prompt(config)}] + history
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=150
        )
        
        ai_message = response.choices[0].message.content.strip()
        
        # Save AI response to history
        save_message(db, phone_number, "assistant", ai_message)
        
        return ai_message
        
    except Exception as e:
        print(f"Conversation AI error: {e}")
        fallback = "Thank you for reaching out! We received your message and will get back to you shortly."
        save_message(db, phone_number, "assistant", fallback)
        return fallback