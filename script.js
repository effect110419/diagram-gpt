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

// Функция для создания XML с правильной структурой BPMN
function createBpmnXml(diagramData) {
    // Очищаем ID от недопустимых символов
    const cleanId = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Создаем XML с правильной структурой
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             id="Definitions_1"
             targetNamespace="http://bpmn.io/schema/bpmn">
    <process id="Process_1" isExecutable="false">`;

    // Добавляем узлы
    const nodes = {};
    diagramData.nodes.forEach((node, index) => {
        const nodeId = cleanId(node.id || `Node_${index}`);
        nodes[node.id] = nodeId;
        
        if (node.type === 'startEvent' || node.type === 'start') {
            xml += `
        <startEvent id="${nodeId}" name="${node.label || 'Начало'}">`;
            // Добавляем исходящие связи
            const outgoing = diagramData.edges
                .filter(e => e.from === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            outgoing.forEach(flowId => {
                xml += `
            <outgoing>${flowId}</outgoing>`;
            });
            xml += `
        </startEvent>`;
        } 
        else if (node.type === 'endEvent' || node.type === 'end') {
            xml += `
        <endEvent id="${nodeId}" name="${node.label || 'Конец'}">`;
            // Добавляем входящие связи
            const incoming = diagramData.edges
                .filter(e => e.to === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            incoming.forEach(flowId => {
                xml += `
            <incoming>${flowId}</incoming>`;
            });
            xml += `
        </endEvent>`;
        }
        else if (node.type === 'task' || node.type === 'action') {
            xml += `
        <task id="${nodeId}" name="${node.label || 'Задача'}">`;
            // Добавляем входящие и исходящие связи
            const incoming = diagramData.edges
                .filter(e => e.to === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            const outgoing = diagramData.edges
                .filter(e => e.from === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            incoming.forEach(flowId => {
                xml += `
            <incoming>${flowId}</incoming>`;
            });
            outgoing.forEach(flowId => {
                xml += `
            <outgoing>${flowId}</outgoing>`;
            });
            xml += `
        </task>`;
        }
        else if (node.type === 'exclusiveGateway' || node.type === 'decision') {
            xml += `
        <exclusiveGateway id="${nodeId}" name="${node.label || 'Вопрос?'}">`;
            // Добавляем входящие и исходящие связи
            const incoming = diagramData.edges
                .filter(e => e.to === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            const outgoing = diagramData.edges
                .filter(e => e.from === node.id)
                .map(e => cleanId(e.id || `Flow_${diagramData.edges.indexOf(e)}`));
            incoming.forEach(flowId => {
                xml += `
            <incoming>${flowId}</incoming>`;
            });
            outgoing.forEach(flowId => {
                xml += `
            <outgoing>${flowId}</outgoing>`;
            });
            xml += `
        </exclusiveGateway>`;
        }
    });

    // Добавляем связи
    diagramData.edges.forEach((edge, index) => {
        const flowId = cleanId(edge.id || `Flow_${index}`);
        const sourceRef = nodes[edge.from] || cleanId(edge.from);
        const targetRef = nodes[edge.to] || cleanId(edge.to);
        xml += `
        <sequenceFlow id="${flowId}" name="${edge.label || ''}" sourceRef="${sourceRef}" targetRef="${targetRef}" />`;
    });

    xml += `
    </process>
    
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;

    // Добавляем позиции (минимальные, авто-раскладка их пересчитает)
    let x = 100;
    let y = 100;
    diagramData.nodes.forEach((node, index) => {
        const nodeId = nodes[node.id];
        let width = 100, height = 80;
        if (node.type.includes('gateway') || node.type === 'decision') {
            width = 50; height = 50;
        } else if (node.type.includes('Event')) {
            width = 36; height = 36;
        }
        xml += `
            <bpmndi:BPMNShape id="${nodeId}_di" bpmnElement="${nodeId}">
                <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
            </bpmndi:BPMNShape>`;
        x += 150;
        if (x > 600) { x = 100; y += 120; }
    });

    // Добавляем позиции для связей
    diagramData.edges.forEach((edge, index) => {
        const flowId = cleanId(edge.id || `Flow_${index}`);
        xml += `
            <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
                <di:waypoint x="0" y="0" />
                <di:waypoint x="0" y="0" />
            </bpmndi:BPMNEdge>`;
    });

    xml += `
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</definitions>`;

    return xml;
}

// Функция для применения авто-раскладки
async function applyAutoLayout(xml) {
    return new Promise((resolve, reject) => {
        try {
            // Используем глобальную библиотеку bpmn-auto-layout
            if (window.bpmnAutoLayout) {
                const layoutedXml = window.bpmnAutoLayout.layout(xml);
                resolve(layoutedXml);
            } else {
                console.warn('Auto-layout library not loaded, using manual layout');
                resolve(xml);
            }
        } catch (error) {
            console.warn('Auto-layout failed:', error);
            resolve(xml);
        }
    });
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
        <button onclick="window.zoomFit()"><i class="fas fa-expand"></i> По размеру</button>
        <button onclick="window.zoomIn()"><i class="fas fa-search-plus"></i> +</button>
        <button onclick="window.zoomOut()"><i class="fas fa-search-minus"></i> -</button>
        <button onclick="window.zoomReset()"><i class="fas fa-redo"></i> 100%</button>
        <button onclick="window.downloadDiagram()"><i class="fas fa-download"></i> Скачать XML</button>
    `;
    container.appendChild(controls);
    
    // Создаём XML
    const bpmnXml = createBpmnXml(diagramData);
    console.log('Original XML:', bpmnXml);
    
    // Применяем авто-раскладку
    const layoutedXml = await applyAutoLayout(bpmnXml);
    console.log('Layouted XML:', layoutedXml);
    
    // Удаляем старый viewer
    if (window.viewer) {
        try { window.viewer.destroy(); } catch (e) {}
    }
    
    // Создаём новый navigated viewer (поддерживает перетаскивание)
    window.viewer = new BpmnJS({
        container: '#bpmn-container',
        keyboard: {
            bindTo: document
        }
    });
    
    try {
        // Импортируем XML
        const { warnings } = await window.viewer.importXML(layoutedXml);
        console.log('BPMN diagram rendered', warnings);
        
        // Получаем canvas
        const canvas = window.viewer.get('canvas');
        
        // Функции масштабирования
        window.zoomFit = () => canvas.zoom('fit-viewport');
        window.zoomIn = () => canvas.zoom(canvas.zoom() * 1.2);
        window.zoomOut = () => canvas.zoom(canvas.zoom() * 0.8);
        window.zoomReset = () => canvas.zoom(1);
        
        window.downloadDiagram = () => {
            window.viewer.saveXML({ format: true }, (err, xml) => {
                if (!err) {
                    const blob = new Blob([xml], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'diagram.bpmn';
                    a.click();
                }
            });
        };
        
        // Автоматически подгоняем
        setTimeout(() => canvas.zoom('fit-viewport'), 100);
        
    } catch (err) {
        console.error('Rendering failed:', err);
        diagramContainer.innerHTML = `<div class="error">Ошибка: ${err.message}</div>`;
    }
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
    
    if (diagramType !== 'bpmn') {
        resultDiv.innerHTML = '<div class="error">UML и ER диаграммы пока в разработке</div>';
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, diagram_type: 'bpmn' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await renderBpmnDiagram(data.diagram, 'result');
        } else {
            resultDiv.innerHTML = `<div class="error">${data.error || 'Ошибка генерации'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Ошибка соединения: ${error.message}</div>`;
    }
});
