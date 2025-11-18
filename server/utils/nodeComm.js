// server/utils/nodeComm.js - SISTEMA COMPLETO DE COMUNICACIÓN ENTRE NODOS
const axios = require('axios');
const LoadBalancer = require('./loadBalancer');

class NodeCommunicator {
    constructor() {
        this.heartbeatInterval = 15000; // 15 segundos
        this.heartbeatTimers = new Map();
        this.taskTimeouts = new Map();
        this.maxRetries = 3;
    }

    /**
     * ✅ ENVIAR TAREA A UN NODO ESPECÍFICO - VERSIÓN COMPLETA
     */
    async sendTaskToNode(node, task) {
        try {
            console.log(`📡 Enviando tarea ${task.id} a nodo ${node.id} (${node.address})`);

            const response = await axios.post(`${node.address}/api/tasks/execute`, {
                taskId: task.id,
                type: task.type,
                data: task.data,
                priority: task.priority || 'normal'
            }, {
                timeout: 30000, // 30 segundos máximo
                headers: {
                    'Content-Type': 'application/json',
                    'X-Node-Secret': process.env.NODE_COMM_SECRET || 'magisoperativos-2024'
                }
            });

            console.log(`✅ Tarea ${task.id} aceptada por nodo ${node.id}`);

            // Configurar timeout para monitorear la tarea
            this.monitorTask(node, task, response.data);

            return {
                success: true,
                response: response.data,
                nodeId: node.id
            };

        } catch (error) {
            console.error(`❌ Error enviando tarea a nodo ${node.id}:`, error.message);
            
            // Reintentar si es posible
            if (task.retryCount < this.maxRetries) {
                console.log(`🔄 Reintentando tarea ${task.id} (intento ${task.retryCount + 1})`);
                return await this.retryTask(node, task);
            }

            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    /**
     * ✅ MONITOREAR TAREA EN EJECUCIÓN
     */
    monitorTask(node, task, initialResponse) {
        const timeout = setTimeout(async () => {
            console.log(`⏰ Verificando estado de tarea ${task.id} en nodo ${node.id}`);
            
            try {
                const status = await this.getTaskStatus(node, task.id);
                
                if (status.success) {
                    if (status.data.status === 'completed') {
                        console.log(`✅ Tarea ${task.id} completada en nodo ${node.id}`);
                        LoadBalancer.completeTask(node.id, task.id, status.data.processingTime);
                        this.taskTimeouts.delete(task.id);
                    } else if (status.data.status === 'failed') {
                        console.log(`❌ Tarea ${task.id} falló en nodo ${node.id}`);
                        LoadBalancer.failTask(node.id, task.id, status.data.error);
                        this.taskTimeouts.delete(task.id);
                    } else {
                        // Tarea aún en progreso, reprogramar verificación
                        this.monitorTask(node, task, initialResponse);
                    }
                } else {
                    console.log(`⚠️ No se pudo verificar tarea ${task.id}, reintentando...`);
                    this.monitorTask(node, task, initialResponse);
                }
            } catch (error) {
                console.error(`❌ Error monitoreando tarea ${task.id}:`, error.message);
                this.monitorTask(node, task, initialResponse);
            }
        }, 10000); // Verificar cada 10 segundos

        this.taskTimeouts.set(task.id, timeout);
    }

    /**
     * ✅ OBTENER ESTADO DE UNA TAREA ESPECÍFICA
     */
    async getTaskStatus(node, taskId) {
        try {
            const response = await axios.get(`${node.address}/api/tasks/${taskId}/status`, {
                timeout: 5000
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ✅ REINTENTAR TAREA FALLIDA
     */
    async retryTask(node, task) {
        task.retryCount = (task.retryCount || 0) + 1;
        
        // Pequeño delay antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return await this.sendTaskToNode(node, task);
    }

    /**
     * ✅ VERIFICAR ESTADO DE UN NODO (HEALTH CHECK)
     */
    async checkNodeHealth(node) {
        try {
            const response = await axios.get(`${node.address}/api/health`, {
                timeout: 5000,
                headers: {
                    'X-Node-Secret': process.env.NODE_COMM_SECRET || 'magisoperativos-2024'
                }
            });

            return {
                success: true,
                status: 'online',
                data: response.data,
                timestamp: new Date()
            };
        } catch (error) {
            console.error(`❌ Nodo ${node.id} no responde:`, error.message);
            return {
                success: false,
                status: 'offline',
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * ✅ INICIAR HEARTBEAT PARA UN NODO
     */
    startHeartbeat(node, onStatusChange) {
        console.log(`❤️  Iniciando heartbeat para nodo ${node.id}`);
        
        const heartbeat = async () => {
            const health = await this.checkNodeHealth(node);
            
            // Notificar cambio de estado
            if (onStatusChange) {
                onStatusChange(node.id, health);
            }
            
            // Actualizar en load balancer
            if (health.success) {
                if (LoadBalancer && typeof LoadBalancer.updateNodeStats === 'function') {
                    LoadBalancer.updateNodeStats(node.id, health.data.stats);
                } else {
                    console.warn('⚠️  LoadBalancer.updateNodeStats no disponible aún');
                }
            } else {
                // Marcar nodo como problemático
                const problematicNode = LoadBalancer.nodes.get(node.id);
                if (problematicNode) {
                    problematicNode.status = 'offline';
                }
            }
        };

        // Ejecutar inmediatamente
        heartbeat();

        // Configurar intervalo
        const timer = setInterval(heartbeat, this.heartbeatInterval);
        this.heartbeatTimers.set(node.id, timer);
    }

    /**
     * ✅ DETENER HEARTBEAT
     */
    stopHeartbeat(nodeId) {
        const timer = this.heartbeatTimers.get(nodeId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(nodeId);
            console.log(`🛑 Heartbeat detenido para nodo ${nodeId}`);
        }
    }

    /**
     * ✅ CANCELAR TAREA EN UN NODO
     */
    async cancelTask(node, taskId) {
        try {
            const response = await axios.post(`${node.address}/api/tasks/${taskId}/cancel`, {}, {
                timeout: 5000
            });

            // Limpiar timeout de monitoreo
            const timeout = this.taskTimeouts.get(taskId);
            if (timeout) {
                clearTimeout(timeout);
                this.taskTimeouts.delete(taskId);
            }

            return {
                success: true,
                message: `Tarea ${taskId} cancelada en nodo ${node.id}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ✅ OBTENER ESTADÍSTICAS DE TODOS LOS NODOS
     */
    async getAllNodesHealth() {
        const nodes = Array.from(LoadBalancer.nodes.values());
        const healthChecks = [];
        
        for (const node of nodes) {
            const health = await this.checkNodeHealth(node);
            healthChecks.push({
                nodeId: node.id,
                ...health
            });
        }
        
        return healthChecks;
    }

    /**
     * ✅ LIMPIAR RECURSOS DE UN NODO ELIMINADO
     */
    cleanupNodeResources(nodeId) {
        this.stopHeartbeat(nodeId);
        
        // Limpiar timeouts de tareas de este nodo
        for (const [taskId, timeout] of this.taskTimeouts.entries()) {
            clearTimeout(timeout);
            this.taskTimeouts.delete(taskId);
        }
        
        console.log(`🧹 Recursos liberados para nodo ${nodeId}`);
    }
}

module.exports = new NodeCommunicator();