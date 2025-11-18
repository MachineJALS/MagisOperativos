// client/src/components/Layout/Sidebar.js - VERSIÓN SIN CONFIGURACIONES
import React from 'react';
import { Upload, Files, Monitor } from 'lucide-react'; // ✅ Removido Settings

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'files', label: 'Mis Archivos', icon: Files },
    { id: 'upload', label: 'Subir Archivos', icon: Upload },
    { id: 'monitor', label: 'Monitor del Sistema', icon: Monitor },
    // ✅ ELIMINADO: Configuración
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Navegación</h2>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-center text-sm text-gray-400">
          <p>MAGISOPERATIVOS v1.0</p>
          <p className="mt-1 text-xs">Sistema Distribuido</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;