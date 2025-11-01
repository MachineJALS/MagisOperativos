import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Decodificar el token JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Verificar que el token no haya expirado
        if (payload.exp * 1000 > Date.now()) {
          setUser(payload);
          console.log('✅ Usuario autenticado:', payload.email);
        } else {
          console.log('❌ Token expirado');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('❌ Token inválido:', error);
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return { user, loading, login, logout };
};