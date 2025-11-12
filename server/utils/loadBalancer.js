// server/utils/loadBalancer.js
const Node = require('../models/Node');

class LoadBalancer {
  constructor() {
    this.nodes = new Map();
    this.taskQueue = [];
  }

  registerNode(nodeData) {
    const node = new Node(
      nodeData.id,
      nodeData.type,
      nodeData.capabilities,
      nodeData.address
    );
    this.nodes.set(node.id, node);
    console.log(`✅ Nodo registrado: ${node.id} (${node.type})`);
    return node;
  }

  unregisterNode(nodeId) {
    this.nodes.delete(nodeId);
    console.log(`❌ Nodo eliminado: ${nodeId}`);
  }

  updateNodeStats(nodeId, stats) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.updateStats(stats);
    }
  }

  findBestNode(taskType) {
    const availableNodes = Array.from(this.nodes.values())
      .filter(node => node.canHandleTask(taskType))
      .sort((a, b) => {
        // Priorizar nodos con menos carga
        const loadA = a.stats.activeTasks / a.stats.maxTasks;
        const loadB = b.stats.activeTasks / b.stats.maxTasks;
        return loadA - loadB;
      });

    return availableNodes[0] || null;
  }

  distributeTask(task) {
    const bestNode = this.findBestNode(task.type);
    
    if (!bestNode) {
      // No hay nodos disponibles, encolar tarea
      this.taskQueue.push(task);
      console.log(`⏳ Tarea encolada: ${task.id} (sin nodos disponibles)`);
      return null;
    }

    bestNode.assignTask(task);
    console.log(`📡 Tarea asignada: ${task.id} -> ${bestNode.id}`);
    
    return {
      node: bestNode,
      task: task
    };
  }

  getSystemStats() {
    const nodesArray = Array.from(this.nodes.values());
    
    return {
      totalNodes: nodesArray.length,
      onlineNodes: nodesArray.filter(n => n.status === 'online').length,
      offlineNodes: nodesArray.filter(n => n.status === 'offline').length,
      totalTasks: nodesArray.reduce((sum, node) => sum + node.stats.activeTasks, 0),
      queuedTasks: this.taskQueue.length,
      nodes: nodesArray.map(node => ({
        id: node.id,
        type: node.type,
        status: node.status,
        address: node.address,
        stats: node.stats,
        lastHeartbeat: node.lastHeartbeat
      }))
    };
  }
}

module.exports = new LoadBalancer();