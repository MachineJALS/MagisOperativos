import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay token en la URL (después del redirect de Google)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('✅ Token recibido:', token);
      localStorage.setItem('token', token);
      
      // Decodificar el token para obtener información básica del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('✅ Usuario decodificado:', payload);
        onLogin(payload);
        
        // Redirigir al dashboard
        navigate('/dashboard');
        
        // Limpiar la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('❌ Error procesando token:', error);
        localStorage.removeItem('token');
      }
    }
  }, [onLogin, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MAGISOPERATIVOS
          </h1>
          <p className="text-gray-600 mb-6">Sistema Multimedia Distribuido</p>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span className="text-gray-700 font-medium">Continuar con Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;