// server/models/Node.js
class Node {
  constructor(id, type, capabilities, address) {
    this.id = id;
    this.type = type; // 'conversion', 'streaming', 'storage'
    this.capabilities = capabilities;
    this.address = address;
    this.status = 'offline';
    this.stats = {
      cpu: 0,
      memory: 0,
      network: 0,
      disk: 0,
      activeTasks: 0,
      maxTasks: 10
    };
    this.lastHeartbeat = new Date();
    this.tasks = [];
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.lastHeartbeat = new Date();
    this.status = 'online';
  }

  canHandleTask(taskType) {
    return this.capabilities.includes(taskType) && 
           this.status === 'online' && 
           this.stats.activeTasks < this.stats.maxTasks;
  }

  assignTask(task) {
    this.tasks.push(task);
    this.stats.activeTasks++;
  }

  completeTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.stats.activeTasks = Math.max(0, this.stats.activeTasks - 1);
  }
}

module.exports = Node;