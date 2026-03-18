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

function analyzeScenario(text) {
    // Анализируем текст на наличие альтернативных сценариев
    const hasAlternative = text.toLowerCase().includes('если нет') || 
                          text.toLowerCase().includes('иначе') ||
                          text.toLowerCase().includes('else') ||
                          text.toLowerCase().includes('в противном случае');
    
    const hasParallel = text.toLowerCase().includes('одновременно') ||
                       text.toLowerCase().includes('parallel') ||
                       text.toLowerCase().includes('в то же время');
    
    const hasLoop = text.toLowerCase().includes('повтор') ||
                   text.toLowerCase().includes('цикл') ||
                   text.toLowerCase().includes('пока');
    
    return { hasAlternative, hasParallel, hasLoop };
}

function generateParticipants(diagramData) {
    const actors = new Set();
    
    // Собираем всех участников из данных
    diagramData.nodes.forEach(node => {
        if (node.actor) actors.add(node.actor);
        if (node.type === 'actor') actors.add(node.label);
        if (node.type === 'component' || node.type === 'participant') actors.add(node.label);
        if (node.from) actors.add(node.from);
        if (node.to) actors.add(node.to);
    });
    
    // Добавляем участников из edges
    diagramData.edges.forEach(edge => {
        if (edge.from) actors.add(edge.from);
        if (edge.to) actors.add(edge.to);
    });
    
    return Array.from(actors);
}

function generatePlantUMLCode(diagramData, originalText) {
    const { hasAlternative, hasParallel, hasLoop } = analyzeScenario(originalText);
    const participants = generateParticipants(diagramData);
    
    let plantUML = '@startuml\n\n';
    
    // Глобальные настройки
    plantUML += '!theme plain\n';
    plantUML += 'skinparam defaultTextAlignment center\n';
    plantUML += 'skinparam sequenceArrowThickness 2\n';
    plantUML += 'skinparam roundcorner 10\n';
    plantUML += 'skinparam sequenceParticipantPadding 25\n';
    plantUML += 'skinparam sequenceMessageAlign center\n\n';
    
    // Цветовые темы для разных типов блоков
    plantUML += 'skinparam sequenceGroupBackgroundColor #FFF2CC\n';
    plantUML += 'skinparam sequenceAltBackgroundColor #FCE4D6\n';
    plantUML += 'skinparam sequenceLoopBackgroundColor #E2F0D9\n';
    plantUML += 'skinparam sequenceParBackgroundColor #E0F2F1\n';
    plantUML += 'skinparam noteBackgroundColor #FEF9E7\n';
    plantUML += 'skinparam noteBorderColor #D4B45A\n\n';
    
    // Определяем участников с цветами
    const colors = ['#E1F5FE', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', '#E0F2F1', '#F1F8E9', '#FFF8E1'];
    
    participants.forEach((participant, index) => {
        const participantId = participant.replace(/\s+/g, '');
        const color = colors[index % colors.length];
        plantUML += `participant "${participant}" as ${participantId} order ${index + 1} #${color}\n`;
    });
    
    plantUML += '\n';
    
    // Группируем сообщения по логике
    const mainFlow = [];
    const altFlow = [];
    let isAltSection = false;
    
    diagramData.edges.forEach(edge => {
        const from = edge.from.replace(/\s+/g, '');
        const to = edge.to.replace(/\s+/g, '');
        const label = edge.label || 'действие';
        const isResponse = edge.type === 'response' || 
                          label.toLowerCase().includes('ответ') ||
                          label.toLowerCase().includes('возвращает') ||
                          label.toLowerCase().includes('подтверждает');
        
        const isSelfCall = from === to;
        const arrowType = isResponse ? '-->' : '->';
        
        // Определяем альтернативные сценарии
        if (label.toLowerCase().includes('если нет') || 
            label.toLowerCase().includes('иначе') ||
            label.toLowerCase().includes('else')) {
            isAltSection = true;
            return;
        }
        
        if (isAltSection) {
            altFlow.push({ from, to, label, arrowType, isSelfCall });
        } else {
            mainFlow.push({ from, to, label, arrowType, isSelfCall });
        }
    });
    
    // Рисуем основной поток
    if (hasAlternative && altFlow.length > 0) {
        plantUML += 'alt Успешный сценарий\n';
    }
    
    mainFlow.forEach(msg => {
        if (msg.isSelfCall) {
            plantUML += `${msg.from} -> ${msg.to} : **${msg.label}**\n`;
            plantUML += `activate ${msg.from}\n`;
            plantUML += `note right: внутренняя обработка\n`;
            plantUML += `${msg.from} --> ${msg.to} : **готово**\n`;
            plantUML += `deactivate ${msg.from}\n`;
        } else if (msg.arrowType === '-->') {
            plantUML += `${msg.from} --> ${msg.to} : ${msg.label}\n`;
        } else {
            plantUML += `${msg.from} -> ${msg.to} : ${msg.label}\n`;
        }
    });
    
    // Альтернативный сценарий
    if (hasAlternative && altFlow.length > 0) {
        plantUML += 'else Товар отсутствует\n';
        altFlow.forEach(msg => {
            if (msg.isSelfCall) {
                plantUML += `${msg.from} -> ${msg.to} : **${msg.label}**\n`;
                plantUML += `activate ${msg.from}\n`;
                plantUML += `note right: проверка альтернативы\n`;
                plantUML += `${msg.from} --> ${msg.to} : **результат**\n`;
                plantUML += `deactivate ${msg.from}\n`;
            } else if (msg.arrowType === '-->') {
                plantUML += `${msg.from} --> ${msg.to} : ${msg.label}\n`;
            } else {
                plantUML += `${msg.from} -> ${msg.to} : ${msg.label}\n`;
            }
        });
        plantUML += 'end\n';
    }
    
    // Добавляем примечания для сложных моментов
    plantUML += '\nnote right of Склад\n';
    plantUML += '  <b>Проверка наличия:</b>\n';
    plantUML += '  • Запрос в систему\n';
    plantUML += '  • Проверка остатков\n';
    plantUML += '  • Резервирование\n';
    plantUML += 'end note\n';
    
    plantUML += '@enduml';
    
    return plantUML;
}

async function generateDiagram() {
    const text = document.getElementById('textInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!text.trim()) {
        alert('Введите текст');
        return;
    }
    
    resultDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <span>Нейросеть анализирует сценарий...</span>
        </div>
    `;
    
    try {
        const response = await fetch('https://diagram-gpt-lypo.onrender.com/process-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                diagram_type: 'uml',
                enhanced: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const plantUML = generatePlantUMLCode(data.diagram, text);
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

document.getElementById('generateBtn').addEventListener('click', generateDiagram);
window.copyCode = copyCode;
window.toggleTheme = toggleTheme;
window.autoResize = autoResize;
