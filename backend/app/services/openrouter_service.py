import httpx
import os
from typing import Dict, Any
import json

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "openai/gpt-3.5-turbo"  # или можно использовать бесплатные модели
        
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
            "temperature": 0.3,  # Чем ниже, тем точнее
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}  # Просим вернуть JSON
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
                    {"id": "task1", "type": "action", "label": "Действие", "actor": "роль"}
                ],
                "edges": [
                    {"from": "start", "to": "task1", "label": "условие"}
                ]
            }
            """
        elif diagram_type == "uml":
            return base_prompt + """
            Для UML Sequence диаграммы используй структуру:
            {
                "meta": {"title": "Название", "type": "uml"},
                "nodes": [
                    {"id": "user", "type": "actor", "label": "Пользователь"},
                    {"id": "system", "type": "component", "label": "Система"}
                ],
                "edges": [
                    {"from": "user", "to": "system", "label": "запрос"}
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
                            {"name": "id", "type": "int", "key": true}
                        ]
                    }
                ],
                "edges": [
                    {"from": "entity1", "to": "entity2", "label": "связь"}
                ]
            }
            """
        else:
            return base_prompt
