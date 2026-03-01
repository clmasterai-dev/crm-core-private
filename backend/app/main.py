from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routes import router
from app.webhook import webhook_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM Core API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(webhook_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "CRM API is running"}