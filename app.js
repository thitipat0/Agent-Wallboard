// app.js
// โค้ดนี้จะใช้ใน Renderer Process
// เพื่อสื่อสารกับ Main Process

let agents = [];

const agentsGrid = document.getElementById('agents-grid');
const availableCountEl = document.getElementById('available-count');
const busyCountEl = document.getElementById('busy-count');
const offlineCountEl = document.getElementById('offline-count');
const currentTimeEl = document.getElementById('current-time');

// โหลดข้อมูล agents จาก Main Process
async function loadAgents() {
    try {
        agents = await window.electronAPI.getAgents();
        renderAgents();
        updateStats();
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

// แสดงผล agents บนหน้าจอ
function renderAgents() {
    agentsGrid.innerHTML = '';
    
    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.innerHTML = `
            <div class="agent-name">${agent.name}</div>
            <div>Status: <strong>${agent.status}</strong></div>
            <div class="status-buttons" style="margin-top: 10px;">
                <button class="status-btn available" onclick="updateStatus(${agent.id}, 'available')">Available</button>
                <button class="status-btn busy" onclick="updateStatus(${agent.id}, 'busy')">Busy</button>
                <button class="status-btn offline" onclick="updateStatus(${agent.id}, 'offline')">Offline</button>
            </div>
        `;
        agentsGrid.appendChild(card);
    });
}

// อัพเดทสถานะของ agent
async function updateStatus(agentId, status) {
    try {
        await window.electronAPI.updateAgentStatus(agentId, status);
        
        // อัพเดทข้อมูลในหน่วยความจำ (memory)
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            agent.status = status;
            renderAgents();
            updateStats();
        }
    } catch (error) {
        console.error('Failed to update status:', error);
    }
}

// อัพเดทสถิติ
function updateStats() {
    const available = agents.filter(a => a.status === 'available').length;
    const busy = agents.filter(a => a.status === 'busy').length;
    const offline = agents.filter(a => a.status === 'offline').length;
    
    availableCountEl.textContent = available;
    busyCountEl.textContent = busy;
    offlineCountEl.textContent = offline;
}

// Export ข้อมูล (Lab 8.3)
async function exportData() {
    try {
        const result = await window.electronAPI.exportData(agents);
        if (result.success) {
            console.log(`Data exported to: ${result.path}`);
        }
    } catch (error) {
        console.error('Export failed:', error);
    }
}

// Refresh ข้อมูล
function refreshData() {
    loadAgents();
    updateTime();
}

// แสดงเวลา real-time (Lab 8.4)
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH');
    currentTimeEl.textContent = timeString;
}

// เริ่มต้นแอป
window.addEventListener('DOMContentLoaded', () => {
    loadAgents();
    updateTime();
    
    // อัพเดทเวลาทุก 1 วินาที
    setInterval(updateTime, 1000);
    
    // Auto-refresh ทุก 30 วินาที
    setInterval(loadAgents, 30000);
});
