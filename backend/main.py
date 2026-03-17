import sys
import os
# Добавляем путь к папке backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import logging

# Настраиваем логирование
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    logger.info("GET / called")
    return {"message": "DiagramGPT API работает с реальным AI!", "status": "ok"}

@app.get("/health")
async def health():
    logger.info("GET /health called")
    return {"status": "ok", "timestamp": "2026-03-17"}

@app.post("/process-text")
async def process_text(request: TextRequest):
    logger.info(f"POST /process-text called with type: {request.diagram_type}")
    logger.info(f"Text length: {len(request.text)} chars")
    
    # Проверяем, есть ли ключ API
    if not os.getenv("OPENROUTER_API_KEY"):
        logger.error("OPENROUTER_API_KEY not set")
        return {
            "success": False, 
            "error": "OPENROUTER_API_KEY не настроен. Добавь его в переменные окружения на Render."
        }
    
    # Отправляем запрос в OpenRouter
    result = await openrouter_service.generate_diagram(
        request.text, 
        request.diagram_type
    )
    
    logger.info(f"Result success: {result.get('success', False)}")
    if not result.get('success', False):
        logger.error(f"Error: {result.get('error', 'Unknown error')}")
    
    return result

@app.get("/test")
async def test():
    """Тестовый эндпоинт для проверки API ключа"""
    key = os.getenv("OPENROUTER_API_KEY", "не найден")
    masked_key = key[:10] + "..." if key != "не найден" else key
    return {
        "key_status": "установлен" if key != "не найден" else "отсутствует",
        "key_preview": masked_key,
        "message": "API ключ проверен"
    }
