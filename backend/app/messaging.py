from twilio.rest import Client
from dotenv import load_dotenv
import os

load_dotenv()

twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

def send_sms(to_phone: str, message: str) -> dict:
    try:
        msg = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE,
            to=to_phone
        )
        return {"success": True, "sid": msg.sid}
    except Exception as e:
        print(f"SMS ERROR: {e}")
        return {"success": False, "error": str(e)}


def generate_sms_message(contact: dict, lead: dict, score: dict) -> str:
    name = contact.get('name', 'there').split()[0]
    
    if score.get('priority') == 'high':
        return f"Hi {name}, thanks for reaching out to us! We see you have an urgent need and want to help right away. Please call us back at your earliest convenience or reply to this message to schedule immediately."
    
    elif score.get('priority') == 'medium':
        return f"Hi {name}, thanks for your interest! We'd love to help you. One of our team members will be in touch shortly. Feel free to reply here with any questions!"
    
    else:
        return f"Hi {name}, thanks for contacting us! We'll be in touch soon to learn more about how we can help you. Have a great day!"