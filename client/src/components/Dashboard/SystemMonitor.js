import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Network, Server } from 'lucide-react';
import { systemAPI } from '../../services/api';
import { Card, CardContent, CardHeader } from '../UI/Card';

const SystemMonitor = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemInfo();
    const interval = setInterval(loadSystemInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemInfo = async () => {
    try {
      const response = await systemAPI.getHealth();
      setSystemInfo(response.data);
    } catch (error) {
      console.error('Error loading system info:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitor del Sistema</h1>
          <p className="text-gray-600">Estado del sistema distribuido</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando información del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitor del Sistema</h1>
        <p className="text-gray-600">Estado del sistema distribuido</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Server}
          title="Estado del Servidor"
          value="En Línea"
          subtitle="Sistema operativo"
          color="green"
        />
        <StatCard
          icon={Cpu}
          title="Uso de CPU"
          value="45%"
          subtitle="Carga actual"
          color="blue"
        />
        <StatCard
          icon={HardDrive}
          title="Almacenamiento"
          value="1.2 GB"
          subtitle="de 10 GB usado"
          color="purple"
        />
        <StatCard
          icon={Network}
          title="Nodos Activos"
          value="2"
          subtitle="Conectados"
          color="orange"
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Información del Sistema</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Servicio Principal</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-green-600">En Línea</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo activo:</span>
                    <span className="font-medium">{systemInfo?.uptime || '0'} segundos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usuario:</span>
                    <span className="font-medium">{systemInfo?.user || 'No autenticado'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Recursos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memoria:</span>
                    <span className="font-medium">65% usada</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Archivos:</span>
                    <span className="font-medium">24 subidos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sesiones:</span>
                    <span className="font-medium">1 activa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitor;