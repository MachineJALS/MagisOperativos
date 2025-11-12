// client/src/components/Dashboard/SystemMonitor.js - VERSIÓN ORIGINAL
import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, Server, Play, RefreshCw } from 'lucide-react';
import { systemAPI } from '../../services/api';

const SystemMonitor = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadStats = async () => {
    try {
      const response = await systemAPI.getNodes();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      // Datos de ejemplo para desarrollo
      setStats({
        totalNodes: 2,
        onlineNodes: 1,
        totalTasks: 3,
        queuedTasks: 1,
        nodes: [
          {
            id: 'node-conversion-1',
            type: 'conversion',
            status: 'online',
            address: '192.168.1.100:3002',
            stats: {
              cpu: 45,
              memory: 62,
              disk: 78,
              network: 25,
              activeTasks: 2,
              maxTasks: 10
            }
          },
          {
            id: 'node-storage-1', 
            type: 'storage',
            status: 'offline',
            address: '192.168.1.101:3003',
            stats: {
              cpu: 0,
              memory: 0,
              disk: 0,
              network: 0,
              activeTasks: 0,
              maxTasks: 5
            }
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
    return status === 'online' ? 'text-green-500' : 'text-red-500';
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Monitor del Sistema</h2>
          <p className="text-gray-600">Estado de nodos distribuidos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadStats}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Auto-actualizar</span>
          </label>
        </div>
      </div>

      {/* Estadísticas Generales */}
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

      {/* Lista de Nodos */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Nodos del Sistema</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.nodes?.map((node) => (
            <div key={node.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className={`h-5 w-5 ${getStatusColor(node.status)}`} />
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
                      {node.stats.activeTasks}/{node.stats.maxTasks} tareas
                    </p>
                    <p className={`text-xs ${getStatusColor(node.status)}`}>
                      {node.status === 'online' ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Métricas del Nodo */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-gray-400" />
                  <span>CPU:</span>
                  <span className={getUsageColor(node.stats.cpu)}>
                    {node.stats.cpu}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-gray-400" />
                  <span>RAM:</span>
                  <span className={getUsageColor(node.stats.memory)}>
                    {node.stats.memory}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-gray-400" />
                  <span>Red:</span>
                  <span className={getUsageColor(node.stats.network)}>
                    {node.stats.network}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-gray-400" />
                  <span>Disco:</span>
                  <span className={getUsageColor(node.stats.disk)}>
                    {node.stats.disk}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;