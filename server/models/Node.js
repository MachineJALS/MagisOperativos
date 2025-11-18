// server/models/Node.js
class Node {
  constructor(id, type, capabilities, address) {
    this.id = id;
    this.type = type;
    this.capabilities = capabilities;
    this.address = address;
    this.status = 'online';
    this.stats = {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      activeTasks: 0,
      maxTasks: capabilities?.maxTasks || 10,
      completedTasks: 0,
      failedTasks: 0
    };
    this.lastHeartbeat = new Date();
    this.registeredAt = new Date();
    this.tasks = [];
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.lastHeartbeat = new Date();
    
    // Actualizar estado basado en stats
    if (this.stats.cpu > 90 || this.stats.memory > 90) {
      this.status = 'overloaded';
    } else {
      this.status = 'online';
    }
  }

  canHandleTask(taskType) {
    return this.status === 'online' && 
           this.stats.activeTasks < this.stats.maxTasks &&
           this.capabilities.supportedTasks.includes(taskType);
  }

  assignTask(task) {
    this.stats.activeTasks++;
    this.tasks.push({
      ...task,
      assignedAt: new Date(),
      status: 'processing'
    });
  }

  completeTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].status = 'completed';
      this.tasks[taskIndex].completedAt = new Date();
    }
    this.stats.activeTasks = Math.max(0, this.stats.activeTasks - 1);
    this.stats.completedTasks++;
  }

  failTask(taskId, error) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].status = 'failed';
      this.tasks[taskIndex].error = error;
      this.tasks[taskIndex].failedAt = new Date();
    }
    this.stats.activeTasks = Math.max(0, this.stats.activeTasks - 1);
    this.stats.failedTasks++;
  }

  getHealth() {
    const timeSinceHeartbeat = new Date() - this.lastHeartbeat;
    if (timeSinceHeartbeat > 30000) { // 30 segundos
        this.status = 'offline';
    }
    
    // ✅ AGREGAR ESTO para compatibilidad con load balancer:
    return {
        status: this.status,
        cpu: this.stats.cpu,
        memory: this.stats.memory,
        activeTasks: this.stats.activeTasks,
        maxTasks: this.stats.maxTasks,
        completedTasks: this.stats.completedTasks,
        failedTasks: this.stats.failedTasks
    };
}
}

module.exports = Node;