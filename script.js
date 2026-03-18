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
    plantUML += 'skinparam sequenceArrowThickness 2\n';
    plantUML += 'skinparam roundcorner 10\n';
    plantUML += 'skinparam sequenceParticipantPadding 20\n';
    plantUML += 'skinparam sequenceMessageAlign center\n\n';
    
    const actors = new Set();
    diagramData.nodes.forEach(node => {
        if (node.actor) actors.add(node.actor);
        if (node.type === 'actor') actors.add(node.label);
    });
    
    actors.forEach(actor => {
        const actorId = actor.replace(/\s+/g, '');
        plantUML += `actor "${actor}" as ${actorId}\n`;
    });
    
    plantUML += '\n';
    
    diagramData.edges.forEach(edge => {
        const from = edge.from.replace(/\s+/g, '');
        const to = edge.to.replace(/\s+/g, '');
        const label = edge.label || 'запрос';
        plantUML += `${from} -> ${to} : ${label}\n`;
    });
    
    plantUML += '@enduml';
    return plantUML;
}

// 👇🏻 ИСПРАВЛЕННАЯ ФУНКЦИЯ КОДИРОВАНИЯ
function encodePlantUML(text) {
    // 1. UTF-8
    const utf8 = unescape(encodeURIComponent(text));
    
    // 2. Deflate сжатие
    const compressed = pako.deflateRaw(utf8, { level: 9 });
    
    // 3. Бинарная строка
    let binary = '';
    const bytes = new Uint8Array(compressed);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    // 4. Стандартный base64
    let base64 = btoa(binary);
    
    // 5. Алфавиты для замены
    const standardAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const plantumlAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
    
    // 6. Замена символов
    let result = '';
    for (let i = 0; i < base64.length; i++) {
        const char = base64[i];
        if (char === '=') continue; // пропускаем padding
        
        const index = standardAlphabet.indexOf(char);
        if (index >= 0) {
            result += plantumlAlphabet[index];
        } else {
            result += char;
        }
    }
    
    return result;
}

async function renderDiagram(plantUML) {
    const container = document.getElementById('diagramContainer');
    const img = document.getElementById('diagramImage');
    
    if (!container || !img) return;
    
    const encoded = encodePlantUML(plantUML);
    
    // ПРОБУЕМ ОБА ВАРИАНТА
    const urlWithTilde = `https://www.plantuml.com/plantuml/png/~1${encoded}`;
    const urlWithoutTilde = `https://www.plantuml.com/plantuml/png/${encoded}`;
    
    console.log('🔍 Encoded:', encoded);
    console.log('🔍 URL with ~1:', urlWithTilde);
    
    img.src = urlWithTilde;
    window.currentDiagramUrl = urlWithTilde;
    
    return new Promise((resolve, reject) => {
        img.onload = () => {
            console.log('✅ Работает с ~1');
            if (window.pz) window.pz.dispose();
            if (typeof panzoom !== 'undefined') {
                window.pz = panzoom(img, {
                    maxZoom: 5,
                    minZoom: 0.5,
                    bounds: true,
                    boundsPadding: 0.1
                });
            }
            resolve();
        };
        
        img.onerror = () => {
            console.log('❌ С ~1 не работает, пробуем без ~1');
            img.src = urlWithoutTilde;
            window.currentDiagramUrl = urlWithoutTilde;
            
            img.onload = () => {
                console.log('✅ Работает без ~1');
                if (window.pz) window.pz.dispose();
                if (typeof panzoom !== 'undefined') {
                    window.pz = panzoom(img, {
                        maxZoom: 5,
                        minZoom: 0.5,
                        bounds: true,
                        boundsPadding: 0.1
                    });
                }
                resolve();
            };
            
            img.onerror = (e) => {
                console.error('❌❌ Оба варианта не работают', e);
                reject(new Error('Не удалось загрузить диаграмму'));
            };
        };
    });
}

function downloadPNG() {
    if (!window.currentDiagramUrl) return;
    const link = document.createElement('a');
    link.href = window.currentDiagramUrl;
    link.download = 'uml-diagram.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add('active');
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
            <span>Нейросеть создаёт диаграмму...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/process-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, diagram_type: 'uml' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const plantUML = convertToPlantUML(data.diagram);
            const escapedPlantUML = plantUML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
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
                        <pre id="plantUMLCode">${escapedPlantUML}</pre>
                    </div>
                </div>
                
                <div id="diagram" class="tab-content">
                    <div class="diagram-panel">
                        <div class="diagram-controls">
                            <button onclick="if(window.pz) window.pz.zoomIn()"><i class="fas fa-search-plus"></i></button>
                            <button onclick="if(window.pz) window.pz.zoomOut()"><i class="fas fa-search-minus"></i></button>
                            <button onclick="if(window.pz) window.pz.reset()"><i class="fas fa-redo"></i></button>
                            <button onclick="if(window.pz) window.pz.pause()"><i class="fas fa-hand-paper"></i></button>
                            <button onclick="downloadPNG()" class="download-btn">
                                <i class="fas fa-download"></i> PNG
                            </button>
                        </div>
                        <div id="diagramContainer">
                            <img id="diagramImage" style="display: block; width: 100%; height: auto; cursor: grab;">
                        </div>
                    </div>
                </div>
            `;
            
            await renderDiagram(plantUML);
            
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        console.error('Generation error:', error);
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка: ${error.message}</div>`;
    }
});

window.switchTab = switchTab;
window.copyCode = copyCode;
window.downloadPNG = downloadPNG;
window.toggleTheme = toggleTheme;
window.autoResize = autoResize;
