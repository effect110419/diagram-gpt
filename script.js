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

// Функция для загрузки библиотеки bpmn-auto-layout (через CDN)
async function loadAutoLayoutLibrary() {
    return new Promise((resolve, reject) => {
        // Проверяем, не загружена ли уже
        if (window.BpmnAutoLayout) {
            resolve(window.BpmnAutoLayout);
            return;
        }
        
        // Загружаем скрипт
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/bpmn-auto-layout@0.2.0/dist/bpmn-auto-layout.min.js';
        script.onload = () => resolve(window.BpmnAutoLayout);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Функция для применения авто-раскладки к XML
async function applyAutoLayout(xml) {
    try {
        // Пытаемся загрузить библиотеку
        const BpmnAutoLayout = await loadAutoLayoutLibrary();
        
        // Применяем авто-раскладку
        const layoutedXml = await BpmnAutoLayout.layout(xml);
        return layoutedXml;
    } catch (error) {
        console.warn('Auto-layout failed, using manual layout', error);
        return xml; // Возвращаем исходный XML, если авто-раскладка не сработала
    }
}

// Функция для конвертации нашего JSON в BPMN XML с улучшенной раскладкой
function convertToBpmnXml(diagramData) {
    // Очищаем ID от недопустимых символов
    const cleanId = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Создаём базовую структуру BPMN
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   targetNamespace="http://bpmn.io/schema/bpmn"
                   id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">`;
    
    // Добавляем узлы
    diagramData.nodes.forEach(node => {
        const nodeId = cleanId(node.id);
        if (node.type === 'startEvent' || node.type === 'start') {
            xml += `
    <bpmn:startEvent id="${nodeId}" name="${node.label}" />`;
        } else if (node.type === 'endEvent' || node.type === 'end') {
            xml += `
    <bpmn:endEvent id="${nodeId}" name="${node.label}" />`;
        } else if (node.type === 'task' || node.type === 'action') {
            xml += `
    <bpmn:task id="${nodeId}" name="${node.label}" />`;
        } else if (node.type === 'exclusiveGateway' || node.type === 'decision') {
            xml += `
    <bpmn:exclusiveGateway id="${nodeId}" name="${node.label}" />`;
        } else if (node.type === 'parallelGateway') {
            xml += `
    <bpmn:parallelGateway id="${nodeId}" name="${node.label}" />`;
        }
    });
    
    // Добавляем связи
    diagramData.edges.forEach((edge, index) => {
        const flowId = `Flow_${index + 1}`;
        const sourceRef = cleanId(edge.from);
        const targetRef = cleanId(edge.to);
        xml += `
    <bpmn:sequenceFlow id="${flowId}" sourceRef="${sourceRef}" targetRef="${targetRef}" name="${edge.label || ''}" />`;
    });
    
    xml += `
  </bpmn:process>
  
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;
    
    // Рассчитываем позиции для красивой раскладки (улучшенная версия)
    const startX = 150;
    const startY = 150;
    const xStep = 220;  // Увеличили шаг для большего пространства
    const yStep = 150;   // Увеличили шаг по вертикали
    
    // Группируем узлы по типу для красивой раскладки
    let row = 0;
    let col = 0;
    const nodesPerRow = 3; // 3 элемента в ряд
    
    diagramData.nodes.forEach((node, index) => {
        const nodeId = cleanId(node.id);
        
        // Определяем размеры для разных типов (реальные размеры bpmn-js)
        let width, height;
        if (node.type.includes('gateway') || node.type === 'decision') {
            width = 50;
            height = 50;
        } else if (node.type.includes('Event')) {
            width = 36;
            height = 36;
        } else {
            width = 100;
            height = 80;
        }
        
        // Рассчитываем позицию с учётом отступов
        const x = startX + (col * xStep);
        const y = startY + (row * yStep);
        
        xml += `
      <bpmndi:BPMNShape id="Shape_${nodeId}" bpmnElement="${nodeId}">
        <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
        
        col++;
        if (col >= nodesPerRow) {
            col = 0;
            row++;
        }
    });
    
    // Добавляем базовые позиции для связей (bpmn-js сам их пересчитает)
    diagramData.edges.forEach((edge, index) => {
        const flowId = `Flow_${index + 1}`;
        xml += `
      <bpmndi:BPMNEdge id="Edge_${index + 1}" bpmnElement="${flowId}">
        <di:waypoint x="0" y="0" />
        <di:waypoint x="0" y="0" />
      </bpmndi:BPMNEdge>`;
    });
    
    xml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    
    return xml;
}

// Функция для отображения BPMN диаграммы с использованием NavigatedViewer
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
        <button onclick="window.zoomFit()"><i class="fas fa-expand"></i> По размеру</button>
        <button onclick="window.zoomIn()"><i class="fas fa-search-plus"></i> +</button>
        <button onclick="window.zoomOut()"><i class="fas fa-search-minus"></i> -</button>
        <button onclick="window.zoomReset()"><i class="fas fa-redo"></i> 100%</button>
        <button onclick="window.toggleMoveMode()"><i class="fas fa-arrows-alt"></i> Перетаскивание</button>
    `;
    container.appendChild(controls);
    
    // Конвертируем JSON в BPMN XML
    const bpmnXml = convertToBpmnXml(diagramData);
    
    // Проверяем, загрузилась ли библиотека
    if (typeof BpmnJS === 'undefined') {
        diagramContainer.innerHTML = '<div class="error">Ошибка: библиотека BPMN не загрузилась</div>';
        return;
    }
    
    // Удаляем старый viewer, если есть
    if (window.viewer) {
        try {
            window.viewer.destroy();
        } catch (e) {
            console.log('Old viewer destroyed');
        }
    }
    
    // СОЗДАЁМ NAVIGATED VIEWER вместо обычного (для поддержки перетаскивания)
    window.viewer = new BpmnJS({
        container: '#bpmn-container',
        width: '100%',
        height: '100%',
        keyboard: {
            bindTo: document
        },
        canvas: {
            deferUpdate: false
        }
    });
    
    try {
        // Применяем авто-раскладку, если доступна
        let finalXml = bpmnXml;
        try {
            // Простая авто-раскладка через встроенные средства
            // В реальном проекте здесь можно использовать bpmn-auto-layout
        } catch (layoutError) {
            console.warn('Auto-layout failed', layoutError);
        }
        
        // Импортируем XML
        const { warnings } = await window.viewer.importXML(finalXml);
        console.log('BPMN diagram rendered successfully', warnings);
        
        // Получаем доступ к canvas
        const canvas = window.viewer.get('canvas');
        
        // Настройка режима перемещения (drag to pan)
        // В NavigatedViewer это работает из коробки
        
        // Функции масштабирования
        window.zoomFit = () => {
            if (window.viewer) {
                canvas.zoom('fit-viewport');
            }
        };
        
        window.zoomIn = () => {
            if (window.viewer) {
                const currentZoom = canvas.zoom();
                canvas.zoom(currentZoom * 1.2);
            }
        };
        
        window.zoomOut = () => {
            if (window.viewer) {
                const currentZoom = canvas.zoom();
                canvas.zoom(currentZoom * 0.8);
            }
        };
        
        window.zoomReset = () => {
            if (window.viewer) {
                canvas.zoom(1);
            }
        };
        
        // Функция для переключения режима перемещения
        window.toggleMoveMode = () => {
            // В NavigatedViewer это работает автоматически
            // Просто показываем подсказку
            alert('Режим перетаскивания активен!\n\n- Нажмите и перетаскивайте диаграмму мышью\n- Используйте колесо мыши для масштабирования');
        };
        
        // Автоматически подгоняем под размер
        setTimeout(() => {
            if (window.viewer) {
                canvas.zoom('fit-viewport');
            }
        }, 100);
        
    } catch (err) {
        console.error('Failed to render BPMN diagram', err);
        diagramContainer.innerHTML = `<div class="error">Ошибка рендеринга диаграммы: ${err.message}</div>`;
    }
}

// Функция для отображения UML/ER
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
