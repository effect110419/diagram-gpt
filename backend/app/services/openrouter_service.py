import httpx
import os
import json
import re
import asyncio
from typing import Dict, Any, Optional, List

class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        
        # СПИСОК МОДЕЛЕЙ (в порядке приоритета)
        self.models = [
            "arcee-ai/trinity-mini:free",           # Trinity Mini (5 успешных у тебя)
            "arcee-ai/trinity-large-preview:free",  # Trinity Large (5 успешных)
            "nvidia/nemotron-nano-9b-v2:free",      # Nemotron Nano (4 успешных)
            "meta-llama/llama-4-maverick:free",      # Llama 4 (топ по рейтингу)
            "stepfun/step-3.5-flash:free",           # StepFun
            "mistralai/mistral-small-3.1-24b-instruct:free"  # Mistral
        ]
        
    async def generate_diagram(self, prompt: str, diagram_type: str) -> Dict[str, Any]:
        """Отправляет запрос с перебором моделей при ошибках"""
        
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
        
        # Пробуем модели по очереди
        for model_index, model in enumerate(self.models):
            print(f"🔄 Пробуем модель [{model_index + 1}/{len(self.models)}]: {model}")
            
            payload = {
                "model": model,
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
                    
                    # Если успешно — парсим и возвращаем
                    if response.status_code == 200:
                        result = response.json()
                        content = result["choices"][0]["message"]["content"]
                        diagram_data = self._extract_json(content)
                        
                        if diagram_data:
                            print(f"✅ Модель {model} успешно сработала!")
                            return {"success": True, "diagram": diagram_data}
                        else:
                            print(f"⚠️ Модель {model} вернула невалидный JSON, пробуем дальше...")
                    
                    # Если 429 (лимит) — ждем и пробуем следующую
                    elif response.status_code == 429:
                        print(f"⏳ Модель {model} превысила лимит, пробуем следующую...")
                        await asyncio.sleep(1)  # маленькая пауза
                    
                    # Любая другая ошибка — просто логируем и идем дальше
                    else:
                        print(f"⚠️ Модель {model} вернула ошибку {response.status_code}, пробуем следующую...")
                        
                except Exception as e:
                    print(f"❌ Ошибка с моделью {model}: {str(e)[:100]}... пробуем дальше")
                    continue
        
        # Если все модели упали — возвращаем тестовую диаграмму
        print("⚠️ Все модели недоступны, возвращаем тестовую диаграмму")
        return {
            "success": True, 
            "diagram": self._get_test_diagram(diagram_type)
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
                "meta": {"title": "Тестовая UML", "type": "uml"},
                "nodes": [
                    {"id": "Пользователь", "type": "actor", "label": "Пользователь"},
                    {"id": "Система", "type": "component", "label": "Система"}
                ],
                "edges": [
                    {"from": "Пользователь", "to": "Система", "label": "запрос"},
                    {"from": "Система", "to": "Пользователь", "label": "ответ"}
                ]
            }
        return {"meta": {"title": "Тест"}, "nodes": [], "edges": []}
    
    def _get_system_prompt(self, diagram_type: str) -> str:
        """Возвращает промпт для нужного типа диаграммы"""
        if diagram_type == "uml":
            return """Ты — эксперт по UML. Создай JSON для sequence диаграммы.
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
Верни ТОЛЬКО JSON."""
        return "Верни пустой JSON: {}"
