from app.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

class LeadStatus(enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    lost = "lost"

class DealStage(enum.Enum):
    proposal = "proposal"
    negotiating = "negotiating"
    closed_won = "closed_won"
    closed_lost = "closed_lost"

class ActivityType(enum.Enum):
    call = "call"
    email = "email"
    sms = "sms"
    meeting = "meeting"
    note = "note"

class UserRole(enum.Enum):
    admin = "admin"
    agent = "agent"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.agent)
    created_at = Column(DateTime, default=datetime.utcnow)

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String)
    company = Column(String)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    leads = relationship("Lead", back_populates="contact", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="contact", cascade="all, delete-orphan")

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.new)
    value_estimate = Column(Float)
    notes = Column(Text)
    score = Column(Integer, nullable=True)
    priority = Column(String, nullable=True)
    reasoning = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    scored_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    contact = relationship("Contact", back_populates="leads")
    deals = relationship("Deal", back_populates="lead")

class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    stage = Column(Enum(DealStage), default=DealStage.proposal)
    value = Column(Float, nullable=False)
    close_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    lead = relationship("Lead", back_populates="deals")

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    type = Column(Enum(ActivityType), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    contact = relationship("Contact", back_populates="activities")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)