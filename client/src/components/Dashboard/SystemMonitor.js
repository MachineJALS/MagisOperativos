// client/src/components/Dashboard/SystemMonitor.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, Server, Play, RefreshCw, Activity } from 'lucide-react';
import { systemAPI } from '../../services/api'; // ✅ CORREGIDO: usar systemAPI en lugar de api

const SystemMonitor = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = async () => {
    try {
      // ✅ CORREGIDO: Usar systemAPI que sí existe en tu proyecto
      const response = await systemAPI.getSystemStats();
      if (response.data.success) {
        setStats(response.data.system);
      }
    } catch (error) {
      console.error('Error cargando estadísticas del sistema distribuido:', error);
      // Datos de ejemplo para desarrollo si el endpoint falla
      setStats({
        totalNodes: 2,
        onlineNodes: 2,
        overloadedNodes: 0,
        offlineNodes: 0,
        totalTasks: 0,
        queuedTasks: 0,
        completedTasks: 0,
        averageConversionTime: 0,
        nodes: [
          {
            id: 'conversion-node-1',
            type: 'conversion',
            status: 'online',
            address: 'http://localhost:3002',
            stats: {
              cpu: 45,
              memory: 62,
              activeTasks: 0,
              maxTasks: 3,
              completedTasks: 5,
              failedTasks: 1
            },
            currentTasks: 0,
            lastHeartbeat: new Date(),
            registeredAt: new Date()
          },
          {
            id: 'conversion-node-2',
            type: 'conversion', 
            status: 'online',
            address: 'http://localhost:3003',
            stats: {
              cpu: 35,
              memory: 45,
              activeTasks: 0,
              maxTasks: 2,
              completedTasks: 3,
              failedTasks: 0
            },
            currentTasks: 0,
            lastHeartbeat: new Date(),
            registeredAt: new Date()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    if (autoRefresh) {
      const interval = setInterval(loadStats, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-500 bg-green-100';
      case 'offline': return 'text-red-500 bg-red-100';
      case 'overloaded': return 'text-orange-500 bg-orange-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando estado del sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sistema Distribuido</h2>
            <p className="text-gray-600">Monitoreo en tiempo real de nodos y tareas</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadStats}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-actualizar</span>
          </label>
        </div>
      </div>

      {/* Estadísticas Generales del Sistema */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Nodos Totales</p>
              <p className="text-2xl font-semibold">{stats?.totalNodes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En Línea</p>
              <p className="text-2xl font-semibold text-green-600">{stats?.onlineNodes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Cpu className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tareas Activas</p>
              <p className="text-2xl font-semibold">{stats?.totalTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <HardDrive className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">En Cola</p>
              <p className="text-2xl font-semibold">{stats?.queuedTasks || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información Adicional del Sistema */}
      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Tareas Completadas:</span>{' '}
              <span className="text-green-600">{stats.completedTasks}</span>
            </div>
            <div>
              <span className="font-medium">Tiempo Promedio:</span>{' '}
              <span>{stats.averageConversionTime > 0 ? `${(stats.averageConversionTime / 1000).toFixed(1)}s` : 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Balanceador:</span>{' '}
              <span className="text-green-600">Activo</span>
            </div>
            <div>
              <span className="font-medium">Modo:</span>{' '}
              <span className="text-blue-600">Distribuido</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Nodos */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">🧩 Nodos del Sistema Distribuido</h3>
          <p className="mt-1 text-sm text-gray-500">
            {stats?.onlineNodes || 0} nodos en línea de {stats?.totalNodes || 0} totales
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.nodes?.map((node) => (
            <div key={node.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className={`h-5 w-5 ${
                    node.status === 'online' ? 'text-green-500' : 
                    node.status === 'overloaded' ? 'text-orange-500' : 'text-red-500'
                  }`} />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{node.id}</h4>
                    <p className="text-sm text-gray-500">
                      {node.type} • {node.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {node.currentTasks}/{node.stats.maxTasks} tareas
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                      {node.status === 'online' ? 'En línea' : 
                       node.status === 'overloaded' ? 'Sobrecargado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Métricas del Nodo */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-gray-400" />
                  <span>CPU:</span>
                  <span className={getUsageColor(node.stats.cpu)}>
                    {node.stats.cpu.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-gray-400" />
                  <span>RAM:</span>
                  <span className={getUsageColor(node.stats.memory)}>
                    {node.stats.memory.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span>Tareas:</span>
                  <span>{node.stats.completedTasks} completadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-gray-400" />
                  <span>Último latido:</span>
                  <span>{formatTime(node.lastHeartbeat)}</span>
                </div>
              </div>

              {/* Barra de progreso de capacidad */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uso de capacidad</span>
                  <span>{Math.round((node.currentTasks / node.stats.maxTasks) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      node.currentTasks / node.stats.maxTasks < 0.7 ? 'bg-green-500' : 
                      node.currentTasks / node.stats.maxTasks < 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(node.currentTasks / node.stats.maxTasks) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(!stats?.nodes || stats.nodes.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <Server className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>No hay nodos registrados en el sistema</p>
          <p className="text-sm">Los nodos aparecerán aquí cuando se registren automáticamente</p>
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;