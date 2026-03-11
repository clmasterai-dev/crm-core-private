from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.webhook import webhook_router

app = FastAPI(title="CRM Core API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(webhook_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "CRM API is running"}