import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TokenHandler = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      console.log('🔄 TokenHandler: Procesando token...');
      localStorage.setItem('token', token);
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('✅ Usuario autenticado:', payload.email);
        onLogin(payload);
        
        // Redirigir al dashboard limpio
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Error procesando token:', error);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    } else {
      // Si no hay token, redirigir al login
      navigate('/login', { replace: true });
    }
  }, [searchParams, onLogin, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
};

export default TokenHandler;