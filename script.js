function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('textInput');
    autoResize(textarea);
});

function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark')) {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Функция для безопасного имени участника (транслит для as)
function transliterateToLatin(text) {
    const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        ' ': '', '-': '', '_': ''
    };
    
    return text.split('').map(c => map[c] || c).join('');
}

// Перевод английских терминов на русский
function translateToRussian(text) {
    const translations = {
        // Основные термины
        'Client': 'Клиент',
        'System': 'Система',
        'Warehouse': 'Склад',
        'Payment Gateway': 'Платежный шлюз',
        'Bank': 'Банк',
        'Email Service': 'Почтовый сервис',
        'Email': 'Почта',
        'Database': 'База данных',
        'Server': 'Сервер',
        'Frontend': 'Фронтенд',
        'Backend': 'Бэкенд',
        'API Gateway': 'API шлюз',
        'Auth Service': 'Сервис авторизации',
        'Queue': 'Очередь',
        'Kafka': 'Кафка',
        'RabbitMQ': 'Кролик',
        'Redis': 'Редис',
        'Cache': 'Кэш',
        'Load Balancer': 'Балансировщик',
        'CDN': 'CDN',
        'DNS': 'DNS',
        
        // Действия
        'Add to cart': 'Добавить в корзину',
        'Check availability': 'Проверить наличие',
        'Availability response': 'Ответ о наличии',
        'Reserve item': 'Зарезервировать товар',
        'Send payment request': 'Отправить запрос оплаты',
        'Check card': 'Проверить карту',
        'Payment confirmation': 'Подтверждение оплаты',
        'Payment success': 'Оплата успешна',
        'Send order confirmation': 'Отправить подтверждение заказа',
        'Send confirmation email': 'Отправить письмо',
        'Process payment': 'Обработать платеж',
        'Verify card': 'Верифицировать карту',
        'Confirm payment': 'Подтвердить оплату',
        'Payment successful': 'Оплата успешна',
        'Order confirmation': 'Подтверждение заказа',
        
        // HTTP методы
        'GET request': 'GET запрос',
        'POST request': 'POST запрос',
        'PUT request': 'PUT запрос',
        'DELETE request': 'DELETE запрос',
        'PATCH request': 'PATCH запрос',
        
        // Ответы
        '200 OK': '200 Успешно',
        '201 Created': '201 Создано',
        '400 Bad Request': '400 Неверный запрос',
        '401 Unauthorized': '401 Не авторизован',
        '403 Forbidden': '403 Доступ запрещен',
        '404 Not Found': '404 Не найдено',
        '500 Internal Error': '500 Ошибка сервера'
    };
    
    // Проверяем точное совпадение
    if (translations[text]) {
        return translations[text];
    }
    
    // Если нет в словаре, оставляем как есть
    return text;
}

// Анализ текста на наличие различных конструкций
function analyzeText(text) {
    const lowerText = text.toLowerCase();
    
    return {
        hasIf: lowerText.includes('если') || lowerText.includes('if '),
        hasElse: lowerText.includes('иначе') || lowerText.includes('else'),
        hasLoop: lowerText.includes('цикл') || lowerText.includes('loop'),
        hasParallel: lowerText.includes('одновременно') || lowerText.includes('parallel'),
        hasQueue: lowerText.includes('кафка') || lowerText.includes('kafka') ||
                 lowerText.includes('rabbit') || lowerText.includes('очередь'),
        hasError: lowerText.includes('ошибк') || lowerText.includes('error')
    };
}

function generatePlantUML(diagramData, originalText) {
    const analysis = analyzeText(originalText);
    let plantUML = '@startuml\n\n';
    
    // Базовые настройки
    plantUML += '!theme plain\n';
    plantUML += 'skinparam defaultTextAlignment center\n';
    plantUML += 'skinparam sequenceArrowThickness 2\n';
    plantUML += 'skinparam roundcorner 10\n';
    plantUML += 'skinparam sequenceParticipantPadding 20\n';
    plantUML += 'skinparam sequenceMessageAlign center\n\n';
    
    // Цветовое кодирование
    plantUML += 'skinparam sequenceGroupBackgroundColor #FFF2CC\n';
    plantUML += 'skinparam sequenceAltBackgroundColor #FCE4D6\n';
    plantUML += 'skinparam sequenceLoopBackgroundColor #E2F0D9\n';
    plantUML += 'skinparam sequenceParBackgroundColor #E0F2F1\n';
    plantUML += 'skinparam noteBackgroundColor #FEF9E7\n';
    plantUML += 'skinparam noteBorderColor #D4B45A\n\n';
    
    // Собираем всех участников
    const participants = new Set();
    
    // Сначала собираем оригинальные названия
    diagramData.nodes?.forEach(node => {
        if (node.actor) participants.add(node.actor);
        if (node.label && !node.actor) participants.add(node.label);
    });
    
    diagramData.edges?.forEach(edge => {
        if (edge.from) participants.add(edge.from);
        if (edge.to) participants.add(edge.to);
    });
    
    // Добавляем участников с русскими названиями
    const colors = ['#E1F5FE', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
                    '#E0F2F1', '#F1F8E9', '#FFF8E1', '#F3E5F5', '#E1F5FE'];
    
    Array.from(participants).forEach((participant, index) => {
        // Переводим название на русский для отображения
        const russianName = translateToRussian(participant);
        // Делаем транслит для идентификатора
        const latinId = transliterateToLatin(russianName);
        const color = colors[index % colors.length];
        
        plantUML += `participant "${russianName}" as ${latinId} order ${index + 1}\n`;
    });
    
    plantUML += '\n';
    
    // Генерация потока сообщений
    let blockLevel = 0;
    let inAlt = false;
    
    if (diagramData.edges) {
        for (let i = 0; i < diagramData.edges.length; i++) {
            const edge = diagramData.edges[i];
            
            // Получаем русские названия для отображения
            const fromRussian = translateToRussian(edge.from);
            const toRussian = translateToRussian(edge.to);
            
            // Делаем транслит для идентификаторов
            const fromLatin = transliterateToLatin(fromRussian);
            const toLatin = transliterateToLatin(toRussian);
            
            // Переводим текст сообщения
            let label = translateToRussian(edge.label || 'запрос');
            const lowerLabel = label.toLowerCase();
            
            // Проверка на начало альтернативного блока
            if (analysis.hasIf && (lowerLabel.includes('если') || lowerLabel.includes('провер'))) {
                if (!inAlt) {
                    plantUML += 'alt Успешный сценарий\n';
                    inAlt = true;
                    blockLevel++;
                }
            }
            
            // Рефлексивный вызов
            if (fromLatin === toLatin) {
                plantUML += `activate ${fromLatin}\n`;
                plantUML += `${fromLatin} -> ${fromLatin} : ${label}\n`;
                plantUML += `note right\n  <b>Обработка:</b>\n  • ${label}\n`;
                
                if (analysis.hasQueue) {
                    plantUML += '  • Отправка в очередь\n';
                }
                
                plantUML += 'end note\n';
                plantUML += `${fromLatin} --> ${fromLatin} : готово\n`;
                plantUML += `deactivate ${fromLatin}\n`;
            }
            // Ответ
            else if (lowerLabel.includes('ответ') || lowerLabel.includes('подтвержд') ||
                     lowerLabel.includes('success') || lowerLabel.includes('confirm')) {
                plantUML += `${fromLatin} --> ${toLatin} : ${label}\n`;
            }
            // Запрос
            else {
                plantUML += `${fromLatin} -> ${toLatin} : ${label}\n`;
            }
            
            // Добавляем заметки для сложных моментов
            if (analysis.hasQueue && (lowerLabel.includes('кафка') || lowerLabel.includes('очередь'))) {
                plantUML += `note right of ${toLatin}\n`;
                plantUML += '  <b>Очередь сообщений:</b>\n';
                plantUML += '  • Сообщение отправлено\n';
                plantUML += '  • Ожидание обработки\n';
                plantUML += 'end note\n';
            }
        }
    }
    
    // Закрываем блоки
    while (blockLevel > 0) {
        plantUML += 'end\n';
        blockLevel--;
    }
    
    plantUML += '@enduml';
    return plantUML;
}

function copyCode() {
    const code = document.getElementById('plantUMLCode');
    if (!code) return;
    
    navigator.clipboard.writeText(code.textContent).then(() => {
        const btn = document.querySelector('.copy-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
    });
}

const API_URL = 'https://diagram-gpt-lypo.onrender.com';

document.getElementById('generateBtn').addEventListener('click', async function() {
    const text = document.getElementById('textInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!text.trim()) {
        alert('Введите текст');
        return;
    }
    
    resultDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <span>Генерация диаграммы...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/process-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                diagram_type: 'uml'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const plantUML = generatePlantUML(data.diagram, text);
            const escapedPlantUML = plantUML
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            resultDiv.innerHTML = `
                <div class="code-panel">
                    <div class="code-header">
                        <span><i class="fas fa-code"></i> PlantUML код</span>
                        <button class="copy-btn" onclick="copyCode()">
                            <i class="fas fa-copy"></i> Копировать
                        </button>
                    </div>
                    <pre id="plantUMLCode">${escapedPlantUML}</pre>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка: ${error.message}</div>`;
    }
});

window.copyCode = copyCode;
window.toggleTheme = toggleTheme;
window.autoResize = autoResize;
