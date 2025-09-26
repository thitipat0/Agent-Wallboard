let agents = [];

// โหลดข้อมูล agents (Lab 8.2)
async function loadAgents() {
    try {
        agents = await window.electronAPI.getAgents();
        renderAgents();
        updateStats();
    } catch (error) {
        console.error('Failed to load agents:', error);
    }
}

// แสดง agents
function renderAgents() {
    const grid = document.getElementById('agents-grid');
    grid.innerHTML = '';
    
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
        grid.appendChild(card);
    });
}

// อัพเดทสถานะ (Lab 8.2 + 8.3)
async function updateStatus(agentId, status) {
    try {
        await window.electronAPI.updateAgentStatus(agentId, status);
        
        // อัพเดทใน memory
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
            agent.status = status;
            renderAgents();
            updateStats();
        }
    } catch (error) {
        alert('Failed to update status');
    }
}

// อัพเดทสถิติ
function updateStats() {
    const available = agents.filter(a => a.status === 'available').length;
    const busy = agents.filter(a => a.status === 'busy').length;
    const offline = agents.filter(a => a.status === 'offline').length;
    
    document.getElementById('available-count').textContent = available;
    document.getElementById('busy-count').textContent = busy;
    document.getElementById('offline-count').textContent = offline;
}

// Export ข้อมูล (Lab 8.3)
async function exportData() {
    try {
        const result = await window.electronAPI.exportData(agents);
        if (result.success) {
            alert(`Data exported to: ${result.path}`);
        }
    } catch (error) {
        alert('Export failed');
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
    const timeString = now.toLocaleTimeString();
    document.getElementById('current-time').textContent = timeString;
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