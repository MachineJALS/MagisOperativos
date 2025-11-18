// server/controllers/nodeController.js
const LoadBalancer = require('../utils/loadBalancer');

const nodeController = {
  // Registrar un nuevo nodo
  registerNode: (req, res) => {
    try {
      const { id, type, capabilities, address } = req.body;
      
      if (!id || !type || !capabilities) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: id, type, capabilities'
        });
      }

      const node = LoadBalancer.registerNode({
        id,
        type,
        capabilities,
        address: address || 'localhost'
      });

      res.json({
        success: true,
        message: 'Nodo registrado exitosamente',
        node: {
          id: node.id,
          type: node.type,
          capabilities: node.capabilities,
          status: node.status
        }
      });

    } catch (error) {
      console.error('❌ Error registrando nodo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Actualizar estadísticas de nodo
  updateNodeStats: (req, res) => {
    try {
      const { nodeId } = req.params;
      const stats = req.body;

      LoadBalancer.updateNodeStats(nodeId, stats);

      res.json({
        success: true,
        message: 'Estadísticas actualizadas'
      });

    } catch (error) {
      console.error('❌ Error actualizando stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas del sistema
  getSystemStats: (req, res) => {
    try {
      const stats = LoadBalancer.getSystemStats();

      res.json({
        success: true,
        stats: stats
      });

    } catch (error) {
      console.error('❌ Error obteniendo stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Distribuir tarea
  distributeTask: (req, res) => {
    try {
      const { type, data, priority = 'normal' } = req.body;

      const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        data: data,
        priority: priority,
        createdAt: new Date(),
        status: 'pending'
      };

      const assignment = LoadBalancer.distributeTask(task);

      if (!assignment) {
        return res.json({
          success: true,
          assigned: false,
          task: task,
          message: 'Tarea encolada - no hay nodos disponibles'
        });
      }

      res.json({
        success: true,
        assigned: true,
        task: task,
        node: {
          id: assignment.node.id,
          address: assignment.node.address,
          type: assignment.node.type
        },
        message: 'Tarea asignada a nodo'
      });

    } catch (error) {
      console.error('❌ Error distribuyendo tarea:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};

module.exports = nodeController;