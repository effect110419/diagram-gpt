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

// Функция создания XML
function createBpmnXml(diagramData) {
    const cleanId = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_1"
             targetNamespace="http://bpmn.io/schema/bpmn">
    <process id="Process_1" isExecutable="false">`;

    const nodeMap = new Map();
    diagramData.nodes.forEach((node, index) => {
        const nodeId = `Node_${index}`;
        nodeMap.set(node.id, nodeId);
        
        if (node.type === 'startEvent' || node.type === 'start') {
            xml += `
        <startEvent id="${nodeId}" name="${node.label || 'Начало'}">`;
            diagramData.edges.forEach((edge, i) => {
                if (edge.from === node.id) {
                    xml += `
            <outgoing>Flow_${i}</outgoing>`;
                }
            });
            xml += `
        </startEvent>`;
        }
        else if (node.type === 'endEvent' || node.type === 'end') {
            xml += `
        <endEvent id="${nodeId}" name="${node.label || 'Конец'}">`;
            diagramData.edges.forEach((edge, i) => {
                if (edge.to === node.id) {
                    xml += `
            <incoming>Flow_${i}</incoming>`;
                }
            });
            xml += `
        </endEvent>`;
        }
        else if (node.type === 'task' || node.type === 'action') {
            xml += `
        <task id="${nodeId}" name="${node.label || 'Задача'}">`;
            diagramData.edges.forEach((edge, i) => {
                if (edge.to === node.id) {
                    xml += `
            <incoming>Flow_${i}</incoming>`;
                }
                if (edge.from === node.id) {
                    xml += `
            <outgoing>Flow_${i}</outgoing>`;
                }
            });
            xml += `
        </task>`;
        }
        else if (node.type === 'exclusiveGateway' || node.type === 'decision') {
            xml += `
        <exclusiveGateway id="${nodeId}" name="${node.label || '?'}">`;
            diagramData.edges.forEach((edge, i) => {
                if (edge.to === node.id) {
                    xml += `
            <incoming>Flow_${i}</incoming>`;
                }
                if (edge.from === node.id) {
                    xml += `
            <outgoing>Flow_${i}</outgoing>`;
                }
            });
            xml += `
        </exclusiveGateway>`;
        }
    });

    diagramData.edges.forEach((edge, index) => {
        const fromId = nodeMap.get(edge.from) || `Node_${diagramData.nodes.findIndex(n => n.id === edge.from)}`;
        const toId = nodeMap.get(edge.to) || `Node_${diagramData.nodes.findIndex(n => n.id === edge.to)}`;
        xml += `
        <sequenceFlow id="Flow_${index}" name="${edge.label || ''}" sourceRef="${fromId}" targetRef="${toId}" />`;
    });

    xml += `
    </process>
    
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">`;

    let x = 150, y = 150;
    diagramData.nodes.forEach((node, index) => {
        const nodeId = `Node_${index}`;
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
        x += 200;
        if (x > 800) { x = 150; y += 150; }
    });

    diagramData.edges.forEach((edge, index) => {
        xml += `
            <bpmndi:BPMNEdge id="Flow_${index}_di" bpmnElement="Flow_${index}">
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

// Функция рендера
async function renderBpmnDiagram(diagramData, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const diagramContainer = document.createElement('div');
    diagramContainer.id = 'bpmn-container';
    diagramContainer.style.width = '100%';
    diagramContainer.style.height = '500px';
    diagramContainer.style.border = '2px solid #e5e7eb';
    diagramContainer.style.borderRadius = '16px';
    diagramContainer.style.background = 'white';
    container.appendChild(diagramContainer);
    
    const controls = document.createElement('div');
    controls.style.marginTop = '16px';
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.justifyContent = 'flex-end';
    controls.innerHTML = `
        <button onclick="window.zoomFit()" style="padding:8px 16px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer">По размеру</button>
        <button onclick="window.zoomIn()" style="padding:8px 16px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer">+</button>
        <button onclick="window.zoomOut()" style="padding:8px 16px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer">-</button>
    `;
    container.appendChild(controls);
    
    const xml = createBpmnXml(diagramData);
    
    if (window.viewer) {
        try { window.viewer.destroy(); } catch(e) {}
    }
    
    window.viewer = new BpmnJS({
        container: '#bpmn-container',
        keyboard: { bindTo: document }
    });
    
    try {
        await window.viewer.importXML(xml);
        const canvas = window.viewer.get('canvas');
        
        window.zoomFit = () => canvas.zoom('fit-viewport');
        window.zoomIn = () => canvas.zoom(canvas.zoom() * 1.2);
        window.zoomOut = () => canvas.zoom(canvas.zoom() * 0.8);
        
        setTimeout(() => canvas.zoom('fit-viewport'), 100);
    } catch(err) {
        diagramContainer.innerHTML = `<div style="color:red;padding:20px">Ошибка: ${err.message}</div>`;
    }
}

const API_URL = 'https://diagram-gpt-lypo.onrender.com';

document.getElementById('generateBtn').addEventListener('click', async function() {
    const text = document.getElementById('textInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!text.trim()) {
        alert('Введите текст');
        return;
    }
    
    resultDiv.innerHTML = '<div style="text-align:center;padding:40px">⏳ Генерация...</div>';
    
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
            resultDiv.innerHTML = `<div style="color:red;padding:20px">${data.error}</div>`;
        }
    } catch(error) {
        resultDiv.innerHTML = `<div style="color:red;padding:20px">Ошибка: ${error.message}</div>`;
    }
});
