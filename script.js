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

function convertToPlantUML(diagramData) {
    let plantUML = '@startuml\n';
    
    // Стилизация
    plantUML += '!theme plain\n';
    plantUML += 'skinparam sequenceArrowThickness 2\n';
    plantUML += 'skinparam roundcorner 10\n';
    plantUML += 'skinparam sequenceParticipantPadding 20\n';
    plantUML += 'skinparam sequenceMessageAlign center\n';
    plantUML += 'skinparam sequenceGroupBackgroundColor #FFF2CC\n';
    plantUML += 'skinparam sequenceAltBackgroundColor #FCE4D6\n';
    plantUML += 'skinparam sequenceLoopBackgroundColor #E2F0D9\n';
    plantUML += 'skinparam noteBackgroundColor #FEF9E7\n';
    plantUML += 'skinparam noteBorderColor #D4B45A\n\n';
    
    // Собираем всех участников
    const actors = new Set();
    diagramData.nodes.forEach(node => {
        if (node.actor) actors.add(node.actor);
        if (node.type === 'actor') actors.add(node.label);
        if (node.type === 'component' || node.type === 'participant') actors.add(node.label);
    });
    
    // Если участников мало, добавляем стандартных
    if (actors.size < 2) {
        actors.add('Клиент');
        actors.add('Система');
    }
    
    // Добавляем участников с цветами
    actors.forEach((actor, index) => {
        const actorId = actor.replace(/\s+/g, '');
        const colors = ['#E1F5FE', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC'];
        const color = colors[index % colors.length];
        plantUML += `participant "${actor}" as ${actorId} order ${index + 1} #${color}\n`;
    });
    
    plantUML += '\n';
    
    // Добавляем сообщения с поддержкой группировки и условий
    let messageCount = 0;
    let hasAlt = false;
    let hasLoop = false;
    
    diagramData.edges.forEach((edge, index) => {
        const from = edge.from.replace(/\s+/g, '');
        const to = edge.to.replace(/\s+/g, '');
        let label = edge.label || 'запрос';
        
        // Проверяем, есть ли условия в тексте
        const lowerLabel = label.toLowerCase();
        
        if (lowerLabel.includes('если') || lowerLabel.includes('if') || lowerLabel.includes('проверяет')) {
            if (!hasAlt) {
                plantUML += '\n';
                plantUML += 'alt Успешный сценарий\n';
                hasAlt = true;
            }
        }
        
        if (lowerLabel.includes('повтор') || lowerLabel.includes('цикл') || lowerLabel.includes('loop')) {
            if (!hasLoop) {
                plantUML += '\n';
                plantUML += 'loop Пока условие выполняется\n';
                hasLoop = true;
            }
        }
        
        // Проверяем на альтернативы (иначе/else)
        if (lowerLabel.includes('иначе') || lowerLabel.includes('else') || lowerLabel.includes('если нет')) {
            plantUML += 'else Альтернативный сценарий\n';
        }
        
        // Добавляем сообщение
        plantUML += `${from} -> ${to} : ${label}\n`;
        messageCount++;
        
        // Если много сообщений, добавляем разделитель
        if (messageCount === 3 || messageCount === 7) {
            plantUML += '...\n';
        }
    });
    
    // Закрываем открытые блоки
    if (hasAlt) plantUML += 'end\n';
    if (hasLoop) plantUML += 'end\n';
    
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
    }).catch(() => alert('Не удалось скопировать'));
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
            <span>Нейросеть создаёт PlantUML код...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/process-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text, 
                diagram_type: 'uml',
                enhanced: true // Флаг для улучшенной генерации
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Если AI вернул структуру, конвертируем в PlantUML
            const plantUML = convertToPlantUML(data.diagram);
            
            // Экранируем для безопасного отображения в HTML
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
        console.error('Generation error:', error);
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка: ${error.message}</div>`;
    }
});

window.copyCode = copyCode;
window.toggleTheme = toggleTheme;
window.autoResize = autoResize;
