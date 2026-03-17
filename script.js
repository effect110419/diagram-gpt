// Функция для авто-расширения textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Применить авто-расширение при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('textInput');
    autoResize(textarea);
});

// Тёмная тема
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark')) {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// URL бэкенда (замени на свой!)
const API_URL = 'https://diagram-gpt-lypo.onrender.com';

document.getElementById('generateBtn').addEventListener('click', async function() {
    const text = document.getElementById('textInput').value;
    const diagramType = document.getElementById('diagramType').value;
    const resultDiv = document.getElementById('result');
    
    if (!text.trim()) {
        alert('Введите текст');
        return;
    }
    
    // Показываем загрузку
    resultDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <span>Нейросеть рисует диаграмму...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/process-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: text,
                diagram_type: diagramType 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            let typeIcon = {
                'bpmn': '📊',
                'uml': '🔄',
                'er': '🗄️'
            }[diagramType] || '📋';
            
            let typeName = {
                'bpmn': 'BPMN (бизнес-процесс)',
                'uml': 'UML Sequence (взаимодействие)',
                'er': 'ER-диаграмма (сущность-связь)'
            }[diagramType] || diagramType;
            
            const nodesList = data.diagram.nodes.map(node => 
                `<li><i class="fas fa-circle"></i> ${node.label} <span style="color: var(--text-light); font-size: 12px;">(${node.type})</span></li>`
            ).join('');
            
            const edgesList = data.diagram.edges.map(edge => 
                `<li><i class="fas fa-arrow-right"></i> ${edge.from} → ${edge.to} ${edge.label ? `<span style="color: var(--text-light);">[${edge.label}]</span>` : ''}</li>`
            ).join('');
            
            resultDiv.innerHTML = `
                <div class="diagram-type-badge">
                    <i class="fas fa-${diagramType === 'bpmn' ? 'chart-bar' : (diagramType === 'uml' ? 'code-branch' : 'database')}"></i>
                    ${typeIcon} ${typeName}
                </div>
                
                <div class="diagram-content">
                    <h3>
                        <i class="fas fa-check-circle" style="color: var(--success);"></i>
                        Диаграмма сгенерирована
                    </h3>
                    
                    <div class="diagram-section">
                        <p><i class="fas fa-tag"></i> ${data.diagram.meta.title || 'Диаграмма процесса'}</p>
                    </div>
                    
                    <div class="diagram-section">
                        <p><i class="fas fa-shapes"></i> Узлы (${data.diagram.nodes.length})</p>
                        <ul class="diagram-list">
                            ${nodesList}
                        </ul>
                    </div>
                    
                    <div class="diagram-section">
                        <p><i class="fas fa-link"></i> Связи (${data.diagram.edges.length})</p>
                        <ul class="diagram-list">
                            ${edgesList}
                        </ul>
                    </div>
                    
                    <small>⚡ Тестовый режим · Настоящая генерация от AI будет позже</small>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка соединения: ${error.message}</div>`;
    }
});
