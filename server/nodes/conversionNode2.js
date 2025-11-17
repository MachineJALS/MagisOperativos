// server/nodes/conversionNode2.js - NODO DE CONVERSIÓN #2
const express = require('express');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

const app = express();
app.use(express.json());

// Configuración del nodo (DIFERENTES VALORES)
const NODE_CONFIG = {
    id: 'conversion-node-2',
    type: 'conversion',
    capabilities: ['audio', 'video', 'image'],
    address: 'http://localhost:3003',
    maxConcurrentTasks: 2, // Menos capacidad que el nodo 1
    mainServer: 'http://localhost:3000'
};

// Estado del nodo
let nodeState = {
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastHeartbeat: new Date(),
    status: 'starting'
};

// Almacenamiento de tareas en proceso
const activeTasks = new Map();

/**
 * ✅ REGISTRAR NODO EN SERVIDOR PRINCIPAL
 */
async function registerWithMainServer() {
    try {
        console.log(`📡 Intentando registrar nodo ${NODE_CONFIG.id} en servidor principal...`);
        
        const response = await axios.post(`${NODE_CONFIG.mainServer}/api/nodes/register`, {
            id: NODE_CONFIG.id,
            type: NODE_CONFIG.type,
            capabilities: NODE_CONFIG.capabilities,
            address: NODE_CONFIG.address
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log(`✅ Nodo ${NODE_CONFIG.id} registrado exitosamente en servidor principal`);
            nodeState.status = 'online';
            return true;
        } else {
            throw new Error(response.data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error(`❌ Error registrando nodo ${NODE_CONFIG.id}:`, error.message);
        nodeState.status = 'registration_failed';
        return false;
    }
}

/**
 * ✅ ACTUALIZAR ESTADÍSTICAS DEL NODO
 */
async function updateNodeStats() {
    try {
        // Simular métricas del sistema
        nodeState.cpuUsage = Math.min(100, Math.max(15, Math.random() * 70 + nodeState.activeTasks * 20));
        nodeState.memoryUsage = Math.min(100, Math.max(25, Math.random() * 50 + nodeState.activeTasks * 15));
        nodeState.lastHeartbeat = new Date();

        const stats = {
            cpu: nodeState.cpuUsage,
            memory: nodeState.memoryUsage,
            activeTasks: nodeState.activeTasks,
            maxTasks: NODE_CONFIG.maxConcurrentTasks,
            completedTasks: nodeState.completedTasks,
            failedTasks: nodeState.failedTasks
        };

        // Enviar estadísticas al servidor principal
        await axios.post(`${NODE_CONFIG.mainServer}/api/nodes/${NODE_CONFIG.id}/stats`, stats, {
            timeout: 5000
        });

        console.log(`📊 Stats enviados: CPU ${stats.cpu.toFixed(1)}%, Mem ${stats.memory.toFixed(1)}%, Tareas: ${stats.activeTasks}/${stats.maxTasks}`);
    } catch (error) {
        console.error('❌ Error enviando estadísticas:', error.message);
    }
}

/**
 * ✅ ENDPOINT: EJECUTAR TAREA DE CONVERSIÓN
 */
app.post('/api/tasks/execute', async (req, res) => {
    try {
        const { taskId, type, data, priority } = req.body;
        
        console.log(`🎯 Nodo ${NODE_CONFIG.id} recibió tarea: ${taskId} (${type})`);

        // Verificar capacidad del nodo
        if (nodeState.activeTasks >= NODE_CONFIG.maxConcurrentTasks) {
            return res.status(503).json({
                success: false,
                error: 'Nodo saturado, no puede aceptar más tareas',
                taskId: taskId
            });
        }

        // Registrar tarea como activa
        nodeState.activeTasks++;
        activeTasks.set(taskId, {
            startTime: new Date(),
            type: type,
            data: data,
            status: 'processing'
        });

        // Actualizar estadísticas inmediatamente
        await updateNodeStats();

        // Procesar la tarea (no bloqueante)
        processTask(taskId, type, data)
            .then(result => {
                nodeState.activeTasks--;
                nodeState.completedTasks++;
                activeTasks.delete(taskId);
                updateNodeStats();
                console.log(`✅ Tarea ${taskId} completada exitosamente`);
            })
            .catch(error => {
                nodeState.activeTasks--;
                nodeState.failedTasks++;
                activeTasks.delete(taskId);
                updateNodeStats();
                console.error(`❌ Tarea ${taskId} falló:`, error.message);
            });

        // Respuesta inmediata - tarea aceptada
        res.json({
            success: true,
            message: 'Tarea aceptada y en procesamiento',
            taskId: taskId,
            nodeId: NODE_CONFIG.id,
            estimatedTime: '20-50 segundos'
        });

    } catch (error) {
        console.error(`❌ Error en execute task:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del nodo',
            taskId: req.body.taskId
        });
    }
});

/**
 * ✅ PROCESAR TAREA DE CONVERSIÓN
 */
async function processTask(taskId, taskType, taskData) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`🔄 Procesando tarea ${taskId}:`, taskData);
            
            // Simular conversión (más rápido que el nodo 1)
            const processingTime = Math.random() * 20000 + 10000; // 10-30 segundos
            
            // Simular progreso
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                console.log(`📊 Tarea ${taskId}: ${progress}% completado`);
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                }
            }, processingTime / 10);

            // Simular procesamiento
            setTimeout(() => {
                clearInterval(progressInterval);
                
                const result = {
                    taskId: taskId,
                    status: 'completed',
                    outputFormat: taskData.targetFormat,
                    fileSize: Math.floor(Math.random() * 5000000) + 1000000,
                    processingTime: processingTime,
                    outputPath: `/converted/${taskId}.${taskData.targetFormat}`
                };
                
                resolve(result);
            }, processingTime);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * ✅ ENDPOINT: ESTADO DE TAREA ESPECÍFICA
 */
app.get('/api/tasks/:taskId/status', (req, res) => {
    const { taskId } = req.params;
    const task = activeTasks.get(taskId);
    
    if (!task) {
        return res.status(404).json({
            success: false,
            error: 'Tarea no encontrada'
        });
    }
    
    const elapsed = new Date() - task.startTime;
    const progress = Math.min(95, (elapsed / 30000) * 100); // Más rápido que nodo 1
    
    res.json({
        success: true,
        taskId: taskId,
        status: task.status,
        progress: Math.round(progress),
        elapsedTime: elapsed,
        nodeId: NODE_CONFIG.id
    });
});

/**
 * ✅ ENDPOINT: CANCELAR TAREA
 */
app.post('/api/tasks/:taskId/cancel', (req, res) => {
    const { taskId } = req.params;
    const task = activeTasks.get(taskId);
    
    if (!task) {
        return res.status(404).json({
            success: false,
            error: 'Tarea no encontrada'
        });
    }
    
    // Marcar tarea como cancelada
    task.status = 'cancelled';
    nodeState.activeTasks--;
    activeTasks.delete(taskId);
    
    updateNodeStats();
    
    res.json({
        success: true,
        message: `Tarea ${taskId} cancelada`,
        taskId: taskId
    });
});

/**
 * ✅ ENDPOINT: SALUD DEL NODO
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        nodeId: NODE_CONFIG.id,
        type: NODE_CONFIG.type,
        capabilities: NODE_CONFIG.capabilities,
        timestamp: new Date(),
        stats: {
            cpu: nodeState.cpuUsage,
            memory: nodeState.memoryUsage,
            activeTasks: nodeState.activeTasks,
            maxTasks: NODE_CONFIG.maxConcurrentTasks,
            completedTasks: nodeState.completedTasks,
            failedTasks: nodeState.failedTasks,
            status: nodeState.status
        }
    });
});

/**
 * ✅ ENDPOINT: INFORMACIÓN DEL NODO
 */
app.get('/api/info', (req, res) => {
    res.json({
        nodeId: NODE_CONFIG.id,
        type: NODE_CONFIG.type,
        capabilities: NODE_CONFIG.capabilities,
        address: NODE_CONFIG.address,
        maxConcurrentTasks: NODE_CONFIG.maxConcurrentTasks,
        status: nodeState.status,
        uptime: process.uptime(),
        registeredAt: nodeState.lastHeartbeat
    });
});

/**
 * ✅ INICIALIZACIÓN DEL NODO
 */
async function initializeNode() {
    console.log(`🚀 Iniciando nodo ${NODE_CONFIG.id}...`);
    console.log(`📍 Dirección: ${NODE_CONFIG.address}`);
    console.log(`🎯 Capacidades: ${NODE_CONFIG.capabilities.join(', ')}`);
    
    // Intentar registro
    const registered = await registerWithMainServer();
    
    if (registered) {
        // Configurar actualización periódica de estadísticas
        setInterval(updateNodeStats, 10000);
        
        // Heartbeat adicional cada 30 segundos
        setInterval(() => {
            if (nodeState.status === 'online') {
                updateNodeStats();
            }
        }, 30000);
        
        console.log(`✅ Nodo ${NODE_CONFIG.id} inicializado y listo para tareas`);
    } else {
        console.log(`❌ Nodo ${NODE_CONFIG.id} no pudo registrarse, reintentando en 30 segundos...`);
        setTimeout(initializeNode, 30000);
    }
}

// Iniciar servidor del nodo
app.listen(3003, () => {
    console.log(`🎯 Nodo de conversión ${NODE_CONFIG.id} ejecutándose en puerto 3003`);
    initializeNode();
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log(`\n🛑 Apagando nodo ${NODE_CONFIG.id}...`);
    process.exit(0);
});