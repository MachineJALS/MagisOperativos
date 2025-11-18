// client/src/components/Layout/Header.js - VERSIÓN SIN CSS
import React from 'react';
import { LogOut, User } from 'lucide-react'; // ✅ Removido Settings
import { authAPI } from '../../services/api';

const Header = ({ user, onLogout }) => {
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      if (onLogout) {
        onLogout();
      }
      window.location.href = '/login';
    } catch (error) {
      console.error('Error haciendo logout:', error);
      // Forzar logout localmente
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const handleLogin = () => {
    authAPI.loginWithGoogle();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Logo y Título */}
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">
            🎵 MagisOperativos
          </h1>
          <span className="text-sm text-gray-500 hidden sm:inline-block">
            Sistema Multimedia Distribuido
          </span>
        </div>

        {/* Sección de Usuario */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{user.email}</span>
              </div>
              <button 
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button 
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={handleLogin}
            >
              <User className="w-4 h-4" />
              <span>Iniciar sesión con Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;