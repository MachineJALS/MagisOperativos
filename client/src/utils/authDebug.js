// Pegar esto en la consola del navegador para diagnosticar
const debugAuth = () => {
  console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN');
  console.log('==============================');
  
  const token = localStorage.getItem('token');
  console.log('📦 Token en localStorage:', token ? '✅ PRESENTE' : '❌ AUSENTE');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('👤 Usuario del token:', payload);
      console.log('⏰ Token expira:', new Date(payload.exp * 1000).toLocaleString());
      
      const timeRemaining = Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60);
      console.log('⏱️  Tiempo restante:', timeRemaining + ' minutos');
      
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
    }
  }
  
  console.log('🌐 URL actual:', window.location.href);
  console.log('🔍 Parámetros URL:', Object.fromEntries(new URLSearchParams(window.location.search)));
};

// Ejecutar diagnóstico
debugAuth();