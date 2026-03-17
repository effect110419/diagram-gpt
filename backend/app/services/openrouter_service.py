import httpx
import os
from typing import Dict, Any
import json

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        # Используем бесплатную модель
        self.model = "google/gemini-2.0-flash-exp:free"
        
    async def generate_diagram(self, prompt: str, diagram_type: str) -> Dict[str, Any]:
        """
        Отправляет запрос в OpenRouter и получает структуру диаграммы
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Формируем системный промпт в зависимости от типа диаграммы
        system_prompt = self._get_system_prompt(diagram_type)
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Парсим JSON из ответа
                diagram_data = json.loads(content)
                return {"success": True, "diagram": diagram_data}
                
            except httpx.RequestError as e:
                return {"success": False, "error": f"Ошибка соединения: {str(e)}"}
            except Exception as e:
                return {"success": False, "error": str(e)}
    
    def _get_system_prompt(self, diagram_type: str) -> str:
        """Возвращает системный промпт для нужного типа диаграммы"""
        
        base_prompt = """
        Ты — эксперт по моделированию. Проанализируй текст пользователя и создай JSON-структуру диаграммы.
        Ответ должен быть ТОЛЬКО в формате JSON, без пояснений.
        """
        
        if diagram_type == "bpmn":
            return base_prompt + """
            Для BPMN диаграммы используй такую структуру:
            {
                "meta": {"title": "Название", "type": "bpmn"},
                "nodes": [
                    {"id": "start", "type": "start", "label": "Начало", "actor": "роль"},
                    {"id": "task1", "type": "action", "label": "Действие", "actor": "роль"},
                    {"id": "gateway", "type": "decision", "label": "Вопрос"},
                    {"id": "end", "type": "end", "label": "Конец"}
                ],
                "edges": [
                    {"from": "start", "to": "task1"},
                    {"from": "task1", "to": "gateway", "label": "условие"},
                    {"from": "gateway", "to": "end", "label": "Да"},
                    {"from": "gateway", "to": "task1", "label": "Нет"}
                ],
                "lanes": [
                    {"id": "actor1", "label": "Участник 1", "nodes": ["start", "task1"]}
                ]
            }
            """
        elif diagram_type == "uml":
            return base_prompt + """
            Для UML Sequence диаграммы используй структуру:
            {
                "meta": {"title": "Название", "type": "uml"},
                "nodes": [
                    {"id": "actor1", "type": "actor", "label": "Актёр"},
                    {"id": "comp1", "type": "component", "label": "Компонент"}
                ],
                "edges": [
                    {"from": "actor1", "to": "comp1", "label": "запрос"}
                ]
            }
            """
        elif diagram_type == "er":
            return base_prompt + """
            Для ER диаграммы используй структуру с атрибутами:
            {
                "meta": {"title": "Название", "type": "er"},
                "nodes": [
                    {
                        "id": "entity1",
                        "type": "entity",
                        "label": "Сущность",
                        "attributes": [
                            {"name": "id", "type": "int", "key": true},
                            {"name": "name", "type": "string"}
                        ]
                    }
                ],
                "edges": [
                    {"from": "entity1", "to": "entity2", "label": "1 : N", "type": "relationship"}
                ]
            }
            """
        else:
            return base_prompt
