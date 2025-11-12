// client/src/components/Layout/Header.js - MEJORADO
import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left Side - Menu Button for Mobile */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center - Logo/Brand */}
        <div className="flex-1 md:flex-none text-center md:text-left">
          <h1 className="text-xl font-bold text-gray-900">MagisOperativos</h1>
          <p className="text-sm text-gray-600 hidden md:block">Sistema Multimedia Distribuido</p>
        </div>

        {/* Right Side - User Menu */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">Usuario</p>
            <p className="text-xs text-gray-600">usuario@ejemplo.com</p>
          </div>
          <div className="relative">
            <button className="flex items-center space-x-2 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors">
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;