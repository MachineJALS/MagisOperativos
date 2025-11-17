// server/utils/loadBalancer.js - VERSIÓN CORREGIDA
const Node = require('../models/Node');

class LoadBalancer {
  constructor() {
    this.nodes = new Map();
    this.taskQueue = [];
    this.metrics = {
      totalTasksProcessed: 0,
      totalConversionTime: 0,
      averageConversionTime: 0
    };
    console.log('🔧 LoadBalancer inicializado');
  }

  registerNode(nodeData) {
    try {
      const node = new Node(
        nodeData.id,
        nodeData.type,
        nodeData.capabilities,
        nodeData.address
      );
      
      this.nodes.set(node.id, node);
      console.log(`✅ Nodo registrado: ${node.id} (${node.type})`);
      
      // Iniciar heartbeat para este nodo (se implementará después)
      this.startNodeHeartbeat(node);
      
      // Procesar tareas en cola si hay nodos disponibles
      this.processQueue();
      
      return node;
    } catch (error) {
      console.error('❌ Error registrando nodo:', error);
      throw error;
    }
  }

  unregisterNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      // Reasignar tareas del nodo que se va
      node.tasks.forEach(task => {
        if (task.status === 'processing') {
          this.taskQueue.unshift(task); // Volver a encolar al principio
        }
      });
    }
    
    this.nodes.delete(nodeId);
    console.log(`❌ Nodo eliminado: ${nodeId}`);
    this.processQueue();
  }

  // ✅ CORREGIDO: Método renombrado correctamente
  updateNodeStats(nodeId, stats) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.updateStats(stats);
      console.log(`📊 Stats actualizados para ${nodeId}:`, stats);
    } else {
      console.warn(`⚠️  Nodo ${nodeId} no encontrado para actualizar stats`);
    }
  }

  startNodeHeartbeat(node) {
    console.log(`❤️  Heartbeat iniciado para nodo: ${node.id}`);
    // Esto se implementará con nodeComm después
  }

  findBestNode(taskType) {
    let bestNode = null;
    let bestScore = -1;

    for (const node of this.nodes.values()) {
      // Solo considerar nodos online
      if (node.status !== 'online') continue;
      
      if (node.canHandleTask(taskType)) {
        // Calcular score: menor carga = mejor
        const loadScore = 1 - (node.stats.activeTasks / node.stats.maxTasks);
        const cpuScore = 1 - (node.stats.cpu / 100);
        const memoryScore = 1 - (node.stats.memory / 100);
        
        const totalScore = (loadScore * 0.5) + (cpuScore * 0.3) + (memoryScore * 0.2);
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestNode = node;
        }
      }
    }

    return bestNode;
  }

  distributeTask(task) {
    try {
      const bestNode = this.findBestNode(task.type);
      
      if (!bestNode) {
        // No hay nodos disponibles, encolar tarea
        this.taskQueue.push({
          ...task,
          queuedAt: new Date(),
          status: 'queued'
        });
        console.log(`⏳ Tarea encolada: ${task.id} (sin nodos disponibles)`);
        return null;
      }

      bestNode.assignTask(task);
      console.log(`📡 Tarea asignada: ${task.id} -> ${bestNode.id}`);
      
      return {
        node: bestNode,
        task: task
      };
    } catch (error) {
      console.error('❌ Error distribuyendo tarea:', error);
      return null;
    }
  }

  processQueue() {
    const processedTasks = [];
    
    for (let i = this.taskQueue.length - 1; i >= 0; i--) {
      const task = this.taskQueue[i];
      const assignment = this.distributeTask(task);
      
      if (assignment) {
        processedTasks.push(this.taskQueue.splice(i, 1)[0]);
      }
    }
    
    if (processedTasks.length > 0) {
      console.log(`🔄 Procesadas ${processedTasks.length} tareas de la cola`);
    }
  }

  completeTask(nodeId, taskId, processingTime) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.completeTask(taskId);
      this.metrics.totalTasksProcessed++;
      this.metrics.totalConversionTime += processingTime;
      this.metrics.averageConversionTime = 
        this.metrics.totalConversionTime / this.metrics.totalTasksProcessed;
      
      console.log(`✅ Tarea completada: ${taskId} en ${nodeId} (${processingTime}ms)`);
    }
  }

  failTask(nodeId, taskId, error) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.failTask(taskId, error);
      console.log(`❌ Tarea fallida: ${taskId} en ${nodeId} - ${error}`);
    }
  }

  getSystemStats() {
    const nodesArray = Array.from(this.nodes.values());
    
    const onlineNodes = nodesArray.filter(n => n.status === 'online');
    const overloadedNodes = nodesArray.filter(n => n.status === 'overloaded');
    const offlineNodes = nodesArray.filter(n => n.status === 'offline');
    
    return {
      totalNodes: nodesArray.length,
      onlineNodes: onlineNodes.length,
      overloadedNodes: overloadedNodes.length,
      offlineNodes: offlineNodes.length,
      totalTasks: nodesArray.reduce((sum, node) => sum + node.stats.activeTasks, 0),
      queuedTasks: this.taskQueue.length,
      completedTasks: this.metrics.totalTasksProcessed,
      averageConversionTime: this.metrics.averageConversionTime,
      nodes: nodesArray.map(node => ({
        id: node.id,
        type: node.type,
        status: node.status,
        address: node.address,
        stats: node.stats,
        lastHeartbeat: node.lastHeartbeat,
        registeredAt: node.registeredAt,
        currentTasks: node.tasks.filter(t => t.status === 'processing').length
      }))
    };
  }

  // Limpiar nodos offline antiguos
  cleanupOldNodes(maxAgeHours = 24) {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [nodeId, node] of this.nodes.entries()) {
      const hoursSinceRegistration = (now - node.registeredAt) / (1000 * 60 * 60);
      
      if (node.status === 'offline' && hoursSinceRegistration > maxAgeHours) {
        this.unregisterNode(nodeId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Limpiados ${cleanedCount} nodos offline antiguos`);
    }
  }
}

// ✅ Exportar como instancia singleton
const loadBalancerInstance = new LoadBalancer();
module.exports = loadBalancerInstance;