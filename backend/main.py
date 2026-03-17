from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import os

# Правильный импорт под структуру app/services
from app.services.openrouter_service import OpenRouterService

app = FastAPI(title="DiagramGPT API", docs_url="/docs")

# Разрешаем запросы с любых доменов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем сервис один раз при старте приложения
openrouter_service = OpenRouterService()

class TextRequest(BaseModel):
    text: str
    diagram_type: Literal["bpmn", "uml", "er"] = "bpmn"

@app.get("/")
async def root():
    return {"message": "DiagramGPT API работает с реальным AI!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/process-text")
async def process_text(request: TextRequest):
    # Проверяем, есть ли ключ API
    if not os.getenv("OPENROUTER_API_KEY"):
        return {
            "success": False, 
            "error": "OPENROUTER_API_KEY не настроен. Добавь его в переменные окружения на Render."
        }
    
    # Отправляем запрос в OpenRouter
    result = await openrouter_service.generate_diagram(
        request.text, 
        request.diagram_type
    )
    
    return result
