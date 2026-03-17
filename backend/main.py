import sys
import os
# Добавляем путь к папке backend, чтобы Python нашел app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import os

from app.services.openrouter_service import OpenRouterService

app = FastAPI(title="DiagramGPT API", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openrouter_service = OpenRouterService()

class TextRequest(BaseModel):
    text: str
    diagram_type: Literal["bpmn", "uml", "er"] = "uml"

@app.get("/")
async def root():
    return {"message": "DiagramGPT API работает"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/process-text")
async def process_text(request: TextRequest):
    if not os.getenv("OPENROUTER_API_KEY"):
        return {
            "success": False, 
            "error": "OPENROUTER_API_KEY не настроен"
        }
    
    result = await openrouter_service.generate_diagram(
        request.text, 
        request.diagram_type
    )
    
    return result

@app.get("/test")
async def test():
    key = os.getenv("OPENROUTER_API_KEY", "не найден")
    return {"key": "ok" if key != "не найден" else "error"}
