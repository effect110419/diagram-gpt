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

// Функция для конвертации ответа AI в PlantUML
function convertToPlantUML(diagramData) {
    let plantUML = '@startuml\n';
    plantUML += 'skinparam sequenceArrowThickness 2\n';
    plantUML += 'skinparam roundcorner 10\n';
    plantUML += 'skinparam sequenceParticipantPadding 20\n';
    plantUML += 'skinparam sequenceMessageAlign center\n\n';
    
    // Собираем всех участников
    const actors = new Set();
    diagramData.nodes.forEach(node => {
        if (node.actor) actors.add(node.actor);
        if (node.type === 'actor') actors.add(node.label);
    });
    
    // Добавляем участников
    actors.forEach(actor => {
        plantUML += `actor "${actor}" as ${actor.replace(/\s+/g, '')}\n`;
    });
    
    plantUML += '\n';
    
    // Добавляем сообщения
    diagramData.edges.forEach(edge => {
        const from = edge.from.replace(/\s+/g, '');
        const to = edge.to.replace(/\s+/g, '');
        const label = edge.label || 'запрос';
        plantUML += `${from} -> ${to} : ${label}\n`;
    });
    
    plantUML += '@enduml';
    return plantUML;
}

// Функция для рендеринга диаграммы через PlantUML сервер
async function renderDiagram(plantUML) {
    const container = document.getElementById('diagramContainer');
    const img = document.getElementById('diagramImage');
    
    // Кодируем для PlantUML
    const encoder = new plantumlEncoder();
    const encoded = encoder.encode(plantUML);
    
    // Формируем URL для PNG
    const pngUrl = `https://www.plantuml.com/plantuml/png/${encoded}`;
    const svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    
    // Загружаем PNG
    img.src = pngUrl;
    
    // Сохраняем URL для скачивания
    window.currentDiagramUrl = pngUrl;
    
    return new Promise((resolve, reject) => {
        img.onload = () => {
            // Инициализируем panzoom после загрузки
            if (window.pz) {
                window.pz.dispose();
            }
            
            window.pz = panzoom(img, {
                maxZoom: 5,
                minZoom: 0.5,
                bounds: true,
                boundsPadding: 0.1
            });
            
            resolve();
        };
        
        img.onerror = reject;
    });
}

// Функция для скачивания PNG
function downloadPNG() {
    if (!window.currentDiagramUrl) return;
    
    const link = document.createElement('a');
    link.href = window.currentDiagramUrl;
    link.download = 'uml-diagram.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Копирование кода
function copyCode() {
    const code = document.getElementById('plantUMLCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// URL бэкенда
const API_URL = 'https://diagram-gpt-lypo.onrender.com';

document.getElementById('generateBtn').addEventListener('click', async function() {
    const text = document.getElementById('textInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!text.trim()) {
        alert('Введите текст');
        return;
    }
    
    // Показываем загрузку
    resultDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <span>Нейросеть создаёт диаграмму...</span>
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
                diagram_type: 'uml'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Конвертируем в PlantUML
            const plantUML = convertToPlantUML(data.diagram);
            
            // Создаём структуру результата
            resultDiv.innerHTML = `
                <div class="tabs">
                    <div class="tab active" data-tab="code" onclick="switchTab('code')">
                        <i class="fas fa-code"></i> PlantUML код
                    </div>
                    <div class="tab" data-tab="diagram" onclick="switchTab('diagram')">
                        <i class="fas fa-project-diagram"></i> Диаграмма
                    </div>
                </div>
                
                <div id="code" class="tab-content active">
                    <div class="code-panel">
                        <div class="code-header">
                            <span><i class="fas fa-code"></i> PlantUML код</span>
                            <button class="copy-btn" onclick="copyCode()">
                                <i class="fas fa-copy"></i> Копировать
                            </button>
                        </div>
                        <pre id="plantUMLCode">${plantUML}</pre>
                    </div>
                </div>
                
                <div id="diagram" class="tab-content">
                    <div class="diagram-panel">
                        <div class="diagram-controls">
                            <button onclick="window.pz.zoomIn()"><i class="fas fa-search-plus"></i></button>
                            <button onclick="window.pz.zoomOut()"><i class="fas fa-search-minus"></i></button>
                            <button onclick="window.pz.reset()"><i class="fas fa-redo"></i></button>
                            <button onclick="window.pz.pause()"><i class="fas fa-hand-paper"></i></button>
                            <button onclick="downloadPNG()" class="download-btn">
                                <i class="fas fa-download"></i> PNG
                            </button>
                        </div>
                        <div id="diagramContainer">
                            <img id="diagramImage" style="display: block;">
                        </div>
                    </div>
                </div>
            `;
            
            // Рендерим диаграмму
            await renderDiagram(plantUML);
            
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка: ${error.message}</div>`;
    }
});

// Делаем функции глобальными
window.switchTab = switchTab;
window.copyCode = copyCode;
window.downloadPNG = downloadPNG;
window.toggleTheme = toggleTheme;
window.autoResize = autoResize;
