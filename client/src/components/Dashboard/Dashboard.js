import React, { useState } from 'react';
import Header from '../Layout/Header';
import Sidebar from '../Layout/Sidebar';
import FileUpload from './FileUpload';
import FileList from './FileList';
import SystemMonitor from './SystemMonitor';

const Dashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('files');

  const renderContent = () => {
    switch (activeView) {
      case 'upload':
        return <FileUpload />;
      case 'monitor':
        return <SystemMonitor />;
      case 'files':
      default:
        return <FileList />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;