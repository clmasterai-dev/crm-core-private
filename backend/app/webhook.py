from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.conversation import generate_ai_response
from app.config import load_client_config
from app.messaging import send_sms
from app import models
from twilio.twiml.messaging_response import MessagingResponse

webhook_router = APIRouter()

@webhook_router.post("/webhook/sms")
async def incoming_sms(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    print(f"Incoming SMS from {From}: {Body}")
    
    config = load_client_config()
    
    # Generate AI response
    ai_response = generate_ai_response(db, From, Body, config)
    
    # Check if contact exists, if not create one
    existing_contact = db.query(models.Contact)\
        .filter(models.Contact.phone == From)\
        .first()
    
    if not existing_contact:
        new_contact = models.Contact(
            name=f"SMS Lead {From[-4:]}",
            phone=From,
            source="SMS Inbound"
        )
        db.add(new_contact)
        db.commit()
        db.refresh(new_contact)
        
        # Create a lead for this contact
        new_lead = models.Lead(
            contact_id=new_contact.id,
            notes=Body,
            status=models.LeadStatus.new
        )
        db.add(new_lead)
        db.commit()
        
        print(f"New contact and lead created for {From}")
    
    # Log activity
    if existing_contact:
        activity = models.Activity(
            contact_id=existing_contact.id,
            type=models.ActivityType.sms,
            description=f"Inbound: {Body} | Outbound: {ai_response}"
        )
        db.add(activity)
        db.commit()
    
    # Return TwiML response to Twilio
    resp = MessagingResponse()
    resp.message(ai_response)
    return PlainTextResponse(str(resp), media_type="application/xml")


@webhook_router.get("/webhook/test")
def test_webhook():
    return {"status": "Webhook is live"}