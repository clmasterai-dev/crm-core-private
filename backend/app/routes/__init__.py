from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

# --- Pydantic Schemas ---

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None

class LeadCreate(BaseModel):
    contact_id: int
    status: Optional[str] = "new"
    value_estimate: Optional[float] = None
    notes: Optional[str] = None

class DealCreate(BaseModel):
    lead_id: int
    contact_id: int
    stage: Optional[str] = "proposal"
    value: float
    close_date: Optional[datetime] = None

class ActivityCreate(BaseModel):
    contact_id: int
    lead_id: Optional[int] = None
    type: str
    description: Optional[str] = None

# --- Contact Routes ---

@router.post("/contacts")
def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    db_contact = models.Contact(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.get("/contacts")
def get_contacts(db: Session = Depends(get_db)):
    return db.query(models.Contact).all()

@router.get("/contacts/{contact_id}")
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/contacts/{contact_id}")
def update_contact(contact_id: int, contact: ContactCreate, db: Session = Depends(get_db)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for key, value in contact.dict().items():
        setattr(db_contact, key, value)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(db_contact)
    db.commit()
    return {"message": "Contact deleted"}

# --- Lead Routes ---

@router.post("/leads")
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = models.Lead(**lead.dict())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    return db.query(models.Lead).all()

@router.get("/leads/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/leads/{lead_id}")
def update_lead(lead_id: int, lead: LeadCreate, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for key, value in lead.dict().items():
        setattr(db_lead, key, value)
    db.commit()
    db.refresh(db_lead)
    return db_lead

# --- Deal Routes ---

@router.post("/deals")
def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    db_deal = models.Deal(**deal.dict())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal

@router.get("/deals")
def get_deals(db: Session = Depends(get_db)):
    return db.query(models.Deal).all()

@router.get("/deals/{deal_id}")
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.query(models.Deal).filter(models.Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

# --- Scoring Routes ---

from app.scoring import score_lead, score_leads_batch

@router.get("/leads/{lead_id}/score")
def get_lead_score(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    contact = db.query(models.Contact).filter(models.Contact.id == lead.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    lead_dict = {
        "id": lead.id,
        "notes": lead.notes,
        "value_estimate": lead.value_estimate,
        "status": lead.status.value if lead.status else "new"
    }
    contact_dict = {
        "name": contact.name,
        "source": contact.source,
        "company": contact.company
    }
    
    score = score_lead(contact_dict, lead_dict)
    return {"lead_id": lead_id, **score}

@router.get("/leads/score/all")
def score_all_leads(db: Session = Depends(get_db)):
    leads = db.query(models.Lead).all()
    leads_with_contacts = []
    for lead in leads:
        contact = db.query(models.Contact).filter(models.Contact.id == lead.contact_id).first()
        if contact:
            leads_with_contacts.append({
                "lead": {
                    "id": lead.id,
                    "notes": lead.notes,
                    "value_estimate": lead.value_estimate,
                    "status": lead.status.value if lead.status else "new"
                },
                "contact": {
                    "name": contact.name,
                    "source": contact.source,
                    "company": contact.company
                }
            })
    return score_leads_batch(leads_with_contacts)

# --- Activity Routes ---

@router.post("/activities")
def create_activity(activity: ActivityCreate, db: Session = Depends(get_db)):
    db_activity = models.Activity(**activity.dict())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@router.get("/activities")
def get_activities(db: Session = Depends(get_db)):
    return db.query(models.Activity).all()

@router.get("/activities/contact/{contact_id}")
def get_activities_by_contact(contact_id: int, db: Session = Depends(get_db)):
    return db.query(models.Activity).filter(models.Activity.contact_id == contact_id).all()

# --- Messaging Routes ---

from app.messaging import send_sms, generate_sms_message
from app.scoring import score_lead

@router.post("/leads/{lead_id}/send-sms")
def send_lead_sms(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    contact = db.query(models.Contact).filter(models.Contact.id == lead.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    if not contact.phone:
        raise HTTPException(status_code=400, detail="Contact has no phone number")
    
    lead_dict = {
        "id": lead.id,
        "notes": lead.notes,
        "value_estimate": lead.value_estimate,
        "status": lead.status.value if lead.status else "new"
    }
    contact_dict = {
        "name": contact.name,
        "source": contact.source,
        "company": contact.company
    }
    
    score = score_lead(contact_dict, lead_dict)
    message = generate_sms_message(contact_dict, lead_dict, score)
    result = send_sms(contact.phone, message)
    
    return {
        "success": result["success"],
        "message_sent": message,
        "score": score,
        "contact": contact.name,
        "phone": contact.phone
    }

# --- Config Routes ---

from app.config import load_client_config

@router.get("/config")
def get_client_config():
    return load_client_config()