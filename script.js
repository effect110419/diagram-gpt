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

// Функция для конвертации нашего JSON в BPMN XML
function convertToBpmnXml(diagramData) {
    // Создаём базовую структуру BPMN
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   targetNamespace="http://bpmn.io/schema/bpmn"
                   id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">`;
    
    // Добавляем узлы (startEvent, tasks, gateway, endEvent)
    diagramData.nodes.forEach(node => {
        if (node.type === 'startEvent' || node.type === 'start') {
            xml += `
    <bpmn:startEvent id="${node.id}" name="${node.label}" />`;
        } else if (node.type === 'endEvent' || node.type === 'end') {
            xml += `
    <bpmn:endEvent id="${node.id}" name="${node.label}" />`;
        } else if (node.type === 'task' || node.type === 'action') {
            xml += `
    <bpmn:task id="${node.id}" name="${node.label}" />`;
        } else if (node.type === 'exclusiveGateway' || node.type === 'decision') {
            xml += `
    <bpmn:exclusiveGateway id="${node.id}" name="${node.label}" />`;
        } else if (node.type === 'parallelGateway') {
            xml += `
    <bpmn:parallelGateway id="${node.id}" name="${node.label}" />`;
        }
    });
    
    // Добавляем связи (sequenceFlow)
    diagramData.edges.forEach((edge, index) => {
        const flowId = `Flow_${index + 1}`;
        xml += `
    <bpmn:sequenceFlow id="${flowId}" sourceRef="${edge.from}" targetRef="${edge.to}" name="${edge.label || ''}" />`;
    });
    
    xml += `
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;
    
    // Добавляем позиции для узлов (простые координаты)
    let x = 100;
    let y = 100;
    diagramData.nodes.forEach((node, index) => {
        // Разные размеры для разных типов элементов
        let width = 100;
        let height = 80;
        
        if (node.type.includes('gateway')) {
            width = 50;
            height = 50;
        } else if (node.type.includes('Event')) {
            width = 36;
            height = 36;
        }
        
        xml += `
      <bpmndi:BPMNShape id="Shape_${node.id}" bpmnElement="${node.id}">
        <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
        
        x += 150;
        if (x > 700) {
            x = 100;
            y += 120;
        }
    });
    
    // Добавляем позиции для связей (упрощённо)
    diagramData.edges.forEach((edge, index) => {
        xml += `
      <bpmndi:BPMNEdge id="Edge_${index + 1}" bpmnElement="Flow_${index + 1}">
        <di:waypoint x="150" y="140" />
        <di:waypoint x="250" y="140" />
      </bpmndi:BPMNEdge>`;
    });
    
    xml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    
    return xml;
}

// Функция для отображения BPMN диаграммы
async function renderBpmnDiagram(diagramData, containerId) {
    const container = document.getElementById(containerId);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаём контейнер для диаграммы
    const diagramContainer = document.createElement('div');
    diagramContainer.id = 'bpmn-container';
    diagramContainer.className = 'diagram-container';
    container.appendChild(diagramContainer);
    
    // Добавляем кнопки управления
    const controls = document.createElement('div');
    controls.className = 'diagram-controls';
    controls.innerHTML = `
        <button onclick="window.fitDiagram()"><i class="fas fa-expand"></i> По размеру</button>
        <button onclick="window.zoomIn()"><i class="fas fa-search-plus"></i> +</button>
        <button onclick="window.zoomOut()"><i class="fas fa-search-minus"></i> -</button>
        <button onclick="window.resetZoom()"><i class="fas fa-redo"></i> Сброс</button>
    `;
    container.appendChild(controls);
    
    // Конвертируем JSON в BPMN XML
    const bpmnXml = convertToBpmnXml(diagramData);
    
    // Проверяем, загрузилась ли библиотека
    if (typeof BpmnJS === 'undefined') {
        diagramContainer.innerHTML = '<div class="error">Ошибка: библиотека BPMN не загрузилась</div>';
        return;
    }
    
    // Создаём BPMN viewer
    const viewer = new BpmnJS({
        container: '#bpmn-container'
    });
    
    try {
        await viewer.importXML(bpmnXml);
        console.log('BPMN diagram rendered successfully');
        
        // Сохраняем viewer для глобальных функций
        window.currentViewer = viewer;
        
        // Функции масштабирования
        window.fitDiagram = () => {
            if (window.currentViewer) {
                window.currentViewer.get('canvas').zoom('fit-viewport');
            }
        };
        
        window.zoomIn = () => {
            if (window.currentViewer) {
                window.currentViewer.get('canvas').zoom(1.1);
            }
        };
        
        window.zoomOut = () => {
            if (window.currentViewer) {
                window.currentViewer.get('canvas').zoom(0.9);
            }
        };
        
        window.resetZoom = () => {
            if (window.currentViewer) {
                window.currentViewer.get('canvas').zoom(1);
            }
        };
        
        // Автоматически подгоняем под размер
        setTimeout(() => {
            if (window.currentViewer) {
                window.currentViewer.get('canvas').zoom('fit-viewport');
            }
        }, 100);
        
    } catch (err) {
        console.error('Failed to render BPMN diagram', err);
        diagramContainer.innerHTML = `<div class="error">Ошибка рендеринга диаграммы: ${err.message}</div>`;
    }
}

// Функция для отображения UML/ER (пока просто JSON)
function renderJsonDiagram(diagramData, diagramType, containerId) {
    const container = document.getElementById(containerId);
    
    // Очищаем контейнер
    container.innerHTML = '';
    
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
    
    // Создаём структуру для отображения
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-container';
    
    let nodesList = '';
    if (diagramData.nodes && diagramData.nodes.length) {
        nodesList = diagramData.nodes.map(node => 
            `<li><i class="fas fa-circle"></i> ${node.label} <span style="color: var(--text-light); font-size: 12px;">(${node.type})</span></li>`
        ).join('');
    }
    
    let edgesList = '';
    if (diagramData.edges && diagramData.edges.length) {
        edgesList = diagramData.edges.map(edge => 
            `<li><i class="fas fa-arrow-right"></i> ${edge.from} → ${edge.to} ${edge.label ? `<span style="color: var(--text-light);">[${edge.label}]</span>` : ''}</li>`
        ).join('');
    }
    
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
                <p><i class="fas fa-tag"></i> ${diagramData.meta?.title || 'Диаграмма'}</p>
            </div>
            
            <div class="diagram-section">
                <p><i class="fas fa-shapes"></i> Узлы (${diagramData.nodes?.length || 0})</p>
                <ul class="diagram-list">
                    ${nodesList || '<li>Нет узлов</li>'}
                </ul>
            </div>
            
            <div class="diagram-section">
                <p><i class="fas fa-link"></i> Связи (${diagramData.edges?.length || 0})</p>
                <ul class="diagram-list">
                    ${edgesList || '<li>Нет связей</li>'}
                </ul>
            </div>
            
            <small>⚡ Визуализация для ${typeName} в разработке</small>
        </div>
    `;
    
    container.appendChild(resultDiv);
}

// URL бэкенда
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
            // Очищаем результат перед рендерингом
            resultDiv.innerHTML = '';
            
            if (diagramType === 'bpmn') {
                // Для BPMN рисуем настоящую диаграмму
                await renderBpmnDiagram(data.diagram, 'result');
            } else {
                // Для UML и ER показываем JSON
                renderJsonDiagram(data.diagram, diagramType, 'result');
            }
        } else {
            resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Ошибка соединения: ${error.message}</div>`;
    }
});
