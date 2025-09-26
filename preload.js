const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Lab 8.2: Agent Management
  getAgents: () => ipcRenderer.invoke('get-agents'),
  updateAgentStatus: (id, status) => ipcRenderer.invoke('update-agent-status', id, status),
  
  // Lab 8.3: File Export + Notifications
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  
  // Lab 8.4: API Calls
  apiCall: (url) => ipcRenderer.invoke('api-call', url)
});