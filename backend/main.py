from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional

app = FastAPI(title="DiagramGPT API", docs_url="/docs")

# Разрешаем запросы с любых доменов
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    diagram_type: Literal["bpmn", "uml", "er"] = "bpmn"

@app.get("/")
async def root():
    return {"message": "DiagramGPT API работает!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/process-text")
async def process_text(request: TextRequest):
    # В зависимости от типа диаграммы возвращаем разные тестовые данные
    if request.diagram_type == "bpmn":
        return generate_bpmn()
    elif request.diagram_type == "uml":
        return generate_uml()
    elif request.diagram_type == "er":
        return generate_er()
    else:
        return {"success": False, "error": "Неизвестный тип диаграммы"}

def generate_bpmn():
    """Тестовая BPMN диаграмма"""
    return {
        "success": True,
        "diagram": {
            "meta": {
                "version": "1.0",
                "title": "Бизнес-процесс (BPMN)",
                "type": "bpmn"
            },
            "nodes": [
                {"id": "start", "type": "start", "label": "Старт"},
                {"id": "task1", "type": "action", "label": "Заполнить заявку", "actor": "Клиент"},
                {"id": "gateway", "type": "decision", "label": "Данные верны?"},
                {"id": "task2", "type": "action", "label": "Обработать заявку", "actor": "Менеджер"},
                {"id": "end", "type": "end", "label": "Завершено"}
            ],
            "edges": [
                {"from": "start", "to": "task1"},
                {"from": "task1", "to": "gateway"},
                {"from": "gateway", "to": "task2", "label": "Да"},
                {"from": "gateway", "to": "task1", "label": "Нет (исправить)"},
                {"from": "task2", "to": "end"}
            ],
            "lanes": [
                {"id": "client", "label": "Клиент", "nodes": ["start", "task1"]},
                {"id": "manager", "label": "Менеджер", "nodes": ["task2", "end"]}
            ]
        }
    }

def generate_uml():
    """Тестовая UML Sequence диаграмма"""
    return {
        "success": True,
        "diagram": {
            "meta": {
                "version": "1.0",
                "title": "Взаимодействие (UML Sequence)",
                "type": "uml"
            },
            "nodes": [
                {"id": "user", "type": "actor", "label": "Пользователь"},
                {"id": "ui", "type": "component", "label": "Интерфейс"},
                {"id": "server", "type": "component", "label": "Сервер"},
                {"id": "db", "type": "component", "label": "База данных"}
            ],
            "edges": [
                {"from": "user", "to": "ui", "label": "1. Нажимает кнопку"},
                {"from": "ui", "to": "server", "label": "2. POST /api/data"},
                {"from": "server", "to": "db", "label": "3. SELECT * FROM"},
                {"from": "db", "to": "server", "label": "4. Возвращает данные"},
                {"from": "server", "to": "ui", "label": "5. JSON response"},
                {"from": "ui", "to": "user", "label": "6. Показывает результат"}
            ]
        }
    }

def generate_er():
    """Тестовая ER диаграмма"""
    return {
        "success": True,
        "diagram": {
            "meta": {
                "version": "1.0",
                "title": "Модель данных (ER)",
                "type": "er"
            },
            "nodes": [
                {
                    "id": "users", 
                    "type": "entity", 
                    "label": "Пользователи",
                    "attributes": [
                        {"name": "id", "type": "int", "key": True},
                        {"name": "email", "type": "string"},
                        {"name": "password", "type": "string"},
                        {"name": "created_at", "type": "datetime"}
                    ]
                },
                {
                    "id": "orders", 
                    "type": "entity", 
                    "label": "Заказы",
                    "attributes": [
                        {"name": "id", "type": "int", "key": True},
                        {"name": "user_id", "type": "int"},
                        {"name": "total", "type": "decimal"},
                        {"name": "status", "type": "string"}
                    ]
                },
                {
                    "id": "products", 
                    "type": "entity", 
                    "label": "Товары",
                    "attributes": [
                        {"name": "id", "type": "int", "key": True},
                        {"name": "name", "type": "string"},
                        {"name": "price", "type": "decimal"}
                    ]
                }
            ],
            "edges": [
                {"from": "users", "to": "orders", "label": "1 : N", "type": "relationship"},
                {"from": "orders", "to": "products", "label": "N : M", "type": "relationship"}
            ]
        }
    }
