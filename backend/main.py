from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Разрешаем запросы с любых доменов (чтобы фронтенд мог обращаться)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    diagram_type: str = "bpmn"

@app.get("/")
async def root():
    return {"message": "DiagramGPT API работает!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/process-text")
async def process_text(request: TextRequest):
    # Пока просто возвращаем тестовые данные
    return {
        "success": True,
        "diagram": {
            "meta": {
                "version": "1.0",
                "title": "Тестовая диаграмма",
                "type": request.diagram_type
            },
            "nodes": [
                {"id": "1", "type": "start", "label": "Начало"},
                {"id": "2", "type": "action", "label": "Действие"},
                {"id": "3", "type": "end", "label": "Конец"}
            ],
            "edges": [
                {"from": "1", "to": "2"},
                {"from": "2", "to": "3"}
            ]
        }
    }
