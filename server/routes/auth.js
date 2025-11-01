const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Iniciar autenticación con Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google - VERSIÓN CORREGIDA
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    try {
      // Generar token JWT
      const token = generateToken(req.user);
      
      // Usar CLIENT_URL explícitamente
      const frontendUrl = process.env.CLIENT_URL;
      
      if (!frontendUrl) {
        console.error('❌ CLIENT_URL no configurado');
        return res.status(500).send('Error de configuración del servidor');
      }
      
      console.log('🔀 Redirigiendo a:', `${frontendUrl}/dashboard?token=XXX...`);
      
      // Redirigir al FRONTEND (React)
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
      
    } catch (error) {
      console.error('❌ Error en callback de Google:', error);
      res.status(500).send('Error interno del servidor');
    }
  }
);

// Verificar token (para el frontend)
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ valid: false, error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ valid: false, error: 'Token inválido' });
    }
});

// Cerrar sesión
router.post('/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: 'Sesión cerrada correctamente' });
    });
});

// Obtener perfil de usuario
router.get('/profile', (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

module.exports = router;