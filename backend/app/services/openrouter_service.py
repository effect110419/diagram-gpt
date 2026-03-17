import httpx
import os
import json
import re
from typing import Dict, Any, Optional

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        # Используем стабильную модель
        self.model = "openrouter/auto"
        
    async def generate_diagram(self, prompt: str, diagram_type: str) -> Dict[str, Any]:
        """
        Отправляет запрос в OpenRouter и получает структуру диаграммы
        """
        if not self.api_key:
            return {
                "success": False, 
                "error": "OPENROUTER_API_KEY не настроен"
            }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://diagram-gpt.onrender.com",
            "X-Title": "DiagramGPT"
        }
        
        system_prompt = self._get_system_prompt(diagram_type)
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 2000
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    return {
                        "success": False, 
                        "error": f"OpenRouter ошибка: {response.status_code}"
                    }
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Извлекаем JSON из ответа
                diagram_data = self._extract_json(content)
                
                if diagram_data:
                    return {"success": True, "diagram": diagram_data}
                else:
                    # Если не смогли извлечь JSON, возвращаем тестовые данные
                    return {
                        "success": True, 
                        "diagram": self._get_test_diagram(diagram_type)
                    }
                
            except Exception as e:
                return {
                    "success": False, 
                    "error": f"Ошибка: {str(e)}"
                }
    
    def _extract_json(self, text: str) -> Optional[Dict]:
        """Извлекает JSON из текста, даже если там есть лишнее"""
        try:
            # Пробуем найти JSON между тройными кавычками
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
            if json_match:
                text = json_match.group(1)
            
            # Очищаем от лишних символов
            text = text.strip()
            
            # Пробуем распарсить
            return json.loads(text)
        except:
            try:
                # Если не получилось, пробуем найти любой JSON в тексте
                start = text.find('{')
                end = text.rfind('}') + 1
                if start >= 0 and end > start:
                    json_str = text[start:end]
                    return json.loads(json_str)
            except:
                return None
    
    def _get_test_diagram(self, diagram_type: str) -> Dict:
        """Возвращает тестовую диаграмму для отладки"""
        if diagram_type == "uml":
            return {
                "meta": {"title": "Пример UML", "type": "uml"},
                "nodes": [
                    {"id": "Пользователь", "type": "actor", "label": "Пользователь"},
                    {"id": "Система", "type": "component", "label": "Система"},
                    {"id": "Сервер", "type": "component", "label": "Сервер"}
                ],
                "edges": [
                    {"from": "Пользователь", "to": "Система", "label": "запрос"},
                    {"from": "Система", "to": "Сервер", "label": "проверка"},
                    {"from": "Сервер", "to": "Система", "label": "ответ"},
                    {"from": "Система", "to": "Пользователь", "label": "результат"}
                ]
            }
        else:
            return {"meta": {"title": "Тест"}, "nodes": [], "edges": []}
    
    def _get_system_prompt(self, diagram_type: str) -> str:
        if diagram_type == "uml":
            return """Ты — эксперт по UML. Создай JSON для sequence диаграммы.

Правила:
1. Участники (nodes): каждый участник имеет id и label
2. Сообщения (edges): каждое сообщение имеет from, to, label
3. Ответ должен быть ТОЛЬКО JSON, без пояснений

Формат:
{
    "meta": {"title": "Название", "type": "uml"},
    "nodes": [
        {"id": "Участник1", "type": "actor", "label": "Участник1"},
        {"id": "Участник2", "type": "component", "label": "Участник2"}
    ],
    "edges": [
        {"from": "Участник1", "to": "Участник2", "label": "действие"}
    ]
}

Пример для заказа пиццы:
{
    "meta": {"title": "Заказ пиццы", "type": "uml"},
    "nodes": [
        {"id": "Клиент", "type": "actor", "label": "Клиент"},
        {"id": "Система", "type": "component", "label": "Система"},
        {"id": "Кухня", "type": "component", "label": "Кухня"}
    ],
    "edges": [
        {"from": "Клиент", "to": "Система", "label": "заказать пиццу"},
        {"from": "Система", "to": "Кухня", "label": "готовить"},
        {"from": "Кухня", "to": "Система", "label": "готово"},
        {"from": "Система", "to": "Клиент", "label": "заказ готов"}
    ]
}

Верни ТОЛЬКО JSON для этого текста:"""
        else:
            return "Верни пустой JSON: {}"
