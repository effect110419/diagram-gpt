import httpx
import os
import json
from typing import Dict, Any, Optional

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        # Используем бесплатную модель Google Gemini
        self.model = "openrouter/free"
        
    async def generate_diagram(self, prompt: str, diagram_type: str) -> Dict[str, Any]:
        """
        Отправляет запрос в OpenRouter и получает структуру диаграммы
        """
        # Проверяем наличие ключа
        if not self.api_key:
            return {
                "success": False, 
                "error": "OPENROUTER_API_KEY не настроен. Добавь его в переменные окружения на Render."
            }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://diagram-gpt.onrender.com",  # Для статистики OpenRouter
            "X-Title": "DiagramGPT"  # Название приложения
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
            "max_tokens": 2000,
            "response_format": {"type": "json_object"}
        }
        
        # Логируем запрос для отладки
        print(f"🔵 Отправляем запрос в OpenRouter...")
        print(f"📤 URL: {self.base_url}/chat/completions")
        print(f"📤 Model: {self.model}")
        print(f"📤 Prompt length: {len(prompt)} chars")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                # Логируем статус ответа
                print(f"🔵 Статус ответа: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text
                    print(f"🔴 Ошибка: {error_text}")
                    return {
                        "success": False, 
                        "error": f"OpenRouter вернул ошибку {response.status_code}: {error_text[:200]}"
                    }
                
                result = response.json()
                
                # Проверяем, есть ли ответ
                if "choices" not in result or len(result["choices"]) == 0:
                    return {"success": False, "error": "OpenRouter не вернул choices"}
                
                content = result["choices"][0]["message"]["content"]
                print(f"🔵 Получен ответ от AI, длина: {len(content)} chars")
                
                # Парсим JSON из ответа
                try:
                    # Очищаем ответ от возможных markdown-оберток
                    if content.startswith("```json"):
                        content = content.replace("```json", "").replace("```", "").strip()
                    elif content.startswith("```"):
                        content = content.replace("```", "").strip()
                    
                    diagram_data = json.loads(content)
                    return {"success": True, "diagram": diagram_data}
                    
                except json.JSONDecodeError as e:
                    print(f"🔴 Ошибка парсинга JSON: {e}")
                    print(f"🔴 Полученный контент: {content[:500]}")
                    return {
                        "success": False, 
                        "error": f"Не удалось распарсить ответ AI как JSON: {str(e)}"
                    }
                
            except httpx.RequestError as e:
                print(f"🔴 Ошибка соединения: {str(e)}")
                return {"success": False, "error": f"Ошибка соединения с OpenRouter: {str(e)}"}
            except Exception as e:
                print(f"🔴 Неожиданная ошибка: {str(e)}")
                return {"success": False, "error": f"Неожиданная ошибка: {str(e)}"}
    
    def _get_system_prompt(self, diagram_type: str) -> str:
        """Возвращает системный промпт для нужного типа диаграммы"""
        
        base_prompt = """
        Ты — эксперт по моделированию бизнес-процессов и систем.
        Проанализируй текст пользователя и создай JSON-структуру диаграммы.
        
        ВАЖНО: Ответ должен быть ТОЛЬКО в формате JSON, без пояснений, без markdown-разметки.
        Не используй ```json или другие обертки — только чистый JSON.
        """
        
        if diagram_type == "bpmn":
            return base_prompt + """
            Для BPMN диаграммы используй такую структуру:
            {
                "meta": {"title": "Название процесса", "type": "bpmn"},
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
                    {"id": "comp1", "type": "component", "label": "Компонент"},
                    {"id": "comp2", "type": "component", "label": "Другой компонент"}
                ],
                "edges": [
                    {"from": "actor1", "to": "comp1", "label": "1. запрос"},
                    {"from": "comp1", "to": "comp2", "label": "2. вызов"},
                    {"from": "comp2", "to": "comp1", "label": "3. ответ"},
                    {"from": "comp1", "to": "actor1", "label": "4. результат"}
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
                        "label": "Сущность 1",
                        "attributes": [
                            {"name": "id", "type": "int", "key": true},
                            {"name": "name", "type": "string"}
                        ]
                    },
                    {
                        "id": "entity2",
                        "type": "entity",
                        "label": "Сущность 2",
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
            return base_prompt + "Верни пустой JSON: {}"
