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

// Функция для безопасного имени участника
function safeParticipantName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '');
}

// Анализ текста на наличие различных конструкций
function analyzeText(text) {
    const lowerText = text.toLowerCase();
    
    return {
        // Условные конструкции
        hasIf: lowerText.includes('если') || lowerText.includes('if '),
        hasElse: lowerText.includes('иначе') || lowerText.includes('else'),
        hasWhen: lowerText.includes('когда') || lowerText.includes('when'),
        
        // Циклы
        hasLoop: lowerText.includes('цикл') || lowerText.includes('loop') || 
                lowerText.includes('повтор') || lowerText.includes('repeat'),
        hasWhile: lowerText.includes('пока') || lowerText.includes('while'),
        hasFor: lowerText.includes('для каждого') || lowerText.includes('for each'),
        
        // Параллельность
        hasParallel: lowerText.includes('одновременно') || lowerText.includes('parallel') ||
                    lowerText.includes('в то же время') || lowerText.includes('concurrently'),
        
        // Асинхронность
        hasAsync: lowerText.includes('асинхронно') || lowerText.includes('async') ||
                 lowerText.includes('отправляет') || lowerText.includes('send'),
        
        // Очереди/брокеры
        hasQueue: lowerText.includes('кафка') || lowerText.includes('kafka') ||
                 lowerText.includes('rabbit') || lowerText.includes('queue') ||
                 lowerText.includes('очередь'),
        
        // Обработка ошибок
        hasError: lowerText.includes('ошибк') || lowerText.includes('error') ||
                 lowerText.includes('исключен') || lowerText.includes('exception'),
        
        // Таймауты/задержки
        hasTimeout: lowerText.includes('таймаут') || lowerText.includes('timeout') ||
                   lowerText.includes('задержк') || lowerText.includes('delay')
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
    
    // Цветовое кодирование для разных типов блоков
    plantUML += 'skinparam sequenceGroupBackgroundColor #FFF2CC\n';
    plantUML += 'skinparam sequenceAltBackgroundColor #FCE4D6\n';
    plantUML += 'skinparam sequenceLoopBackgroundColor #E2F0D9\n';
    plantUML += 'skinparam sequenceParBackgroundColor #E0F2F1\n';
    plantUML += 'skinparam sequenceRefBackgroundColor #E8EAF6\n';
    plantUML += 'skinparam noteBackgroundColor #FEF9E7\n';
    plantUML += 'skinparam noteBorderColor #D4B45A\n\n';
    
    // Собираем всех участников
    const participants = new Set();
    
    diagramData.nodes?.forEach(node => {
        if (node.actor) participants.add(node.actor);
        if (node.label) participants.add(node.label);
        if (node.from) participants.add(node.from);
        if (node.to) participants.add(node.to);
    });
    
    diagramData.edges?.forEach(edge => {
        if (edge.from) participants.add(edge.from);
        if (edge.to) participants.add(edge.to);
    });
    
    // Добавляем участников
    const colors = ['#E1F5FE', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
                    '#E0F2F1', '#F1F8E9', '#FFF8E1', '#F3E5F5', '#E1F5FE'];
    
    Array.from(participants).forEach((participant, index) => {
        const safeName = safeParticipantName(participant);
        const color = colors[index % colors.length];
        plantUML += `participant "${participant}" as ${safeName} order ${index + 1}\n`;
    });
    
    plantUML += '\n';
    
    // Генерация потока сообщений
    let blockLevel = 0;
    let inAlt = false;
    let inLoop = false;
    let inPar = false;
    
    if (diagramData.edges) {
        for (let i = 0; i < diagramData.edges.length; i++) {
            const edge = diagramData.edges[i];
            const from = safeParticipantName(edge.from);
            const to = safeParticipantName(edge.to);
            let label = edge.label || 'request';
            const lowerLabel = label.toLowerCase();
            
            // Проверка на начало альтернативного блока
            if (analysis.hasIf && (lowerLabel.includes('если') || lowerLabel.includes('if'))) {
                if (!inAlt) {
                    plantUML += 'alt Успешный сценарий\n';
                    inAlt = true;
                    blockLevel++;
                }
            }
            
            // Проверка на начало цикла
            if (analysis.hasLoop && (lowerLabel.includes('цикл') || lowerLabel.includes('loop'))) {
                if (!inLoop) {
                    plantUML += 'loop Повторение\n';
                    inLoop = true;
                    blockLevel++;
                }
            }
            
            // Проверка на параллельные процессы
            if (analysis.hasParallel && (lowerLabel.includes('одновременно') || lowerLabel.includes('parallel'))) {
                if (!inPar) {
                    plantUML += 'par Параллельно\n';
                    inPar = true;
                    blockLevel++;
                }
            }
            
            // Обработка альтернативных веток
            if (analysis.hasElse && (lowerLabel.includes('иначе') || lowerLabel.includes('else'))) {
                if (inAlt) {
                    plantUML += 'else Альтернативный сценарий\n';
                }
            }
            
            // Рефлексивный вызов (сам в себя)
            if (from === to) {
                plantUML += `activate ${from}\n`;
                plantUML += `${from} -> ${from} : ${label}\n`;
                plantUML += `note right\n  <b>Processing:</b>\n  • ${label}\n`;
                
                // Добавляем детали в зависимости от типа
                if (analysis.hasQueue && lowerLabel.includes('очередь')) {
                    plantUML += '  • Message queued\n  • Waiting for consumer\n';
                }
                if (analysis.hasAsync) {
                    plantUML += '  • Async operation\n  • Callback registered\n';
                }
                if (analysis.hasTimeout) {
                    plantUML += '  • Timeout set\n  • Awaiting response\n';
                }
                
                plantUML += 'end note\n';
                plantUML += `${from} --> ${from} : completed\n`;
                plantUML += `deactivate ${from}\n`;
            }
            // Ответ (пунктирная стрелка)
            else if (lowerLabel.includes('ответ') || lowerLabel.includes('response') ||
                     lowerLabel.includes('confirm') || lowerLabel.includes('подтвержд')) {
                plantUML += `${from} --> ${to} : ${label}\n`;
            }
            // Запрос (сплошная стрелка)
            else {
                plantUML += `${from} -> ${to} : ${label}\n`;
            }
            
            // Добавляем заметки для сложных моментов
            if (analysis.hasQueue && lowerLabel.includes('кафка')) {
                plantUML += `note right of ${to}\n`;
                plantUML += '  <b>Kafka:</b>\n';
                plantUML += '  • Topic: events\n';
                plantUML += '  • Partition: 0\n';
                plantUML += '  • Offset: auto\n';
                plantUML += 'end note\n';
            }
            
            if (analysis.hasError && (lowerLabel.includes('ошибк') || lowerLabel.includes('fail'))) {
                plantUML += `note right of ${from}\n`;
                plantUML += '  <b>Error handling:</b>\n';
                plantUML += '  • Retry policy\n';
                plantUML += '  • Fallback\n';
                plantUML += '  • Logging\n';
                plantUML += 'end note\n';
            }
        }
    }
    
    // Закрываем все открытые блоки
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
            <span>Анализирую сценарий и генерирую диаграмму...</span>
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
