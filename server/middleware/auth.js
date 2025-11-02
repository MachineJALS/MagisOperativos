// server/middleware/auth.js - VERSIÓN MEJORADA
const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Formato: Bearer TOKEN
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.log('❌ Error verificando token:', err.message);
                return res.status(403).json({ 
                    success: false,
                    error: 'Token inválido o expirado' 
                });
            }
            
            // ✅ LOGS DETALLADOS PARA DEBUGGING
            console.log('✅ Usuario autenticado:', {
                id: user.userId || user.id,
                email: user.email,
                permissions: user.permissions
            });
            
            // ✅ NORMALIZAR ESTRUCTURA DEL USUARIO
            req.user = {
                id: user.userId || user.id, // Compatibilidad con ambas formas
                email: user.email,
                permissions: user.permissions || ['user'] // Valor por defecto
            };
            
            next();
        });
    } else {
        console.log('❌ No hay token de autorización en la solicitud');
        res.status(401).json({ 
            success: false,
            error: 'Token de autenticación requerido' 
        });
    }
};

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.permissions && req.user.permissions.includes('admin')) {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            error: 'Se requieren permisos de administrador' 
        });
    }
};

// Generar token JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, // ✅ USAR 'id' CONSISTENTEMENTE
            userId: user.id, // ✅ MANTENER COMPATIBILIDAD
            email: user.email,
            permissions: user.permissions || ['user']
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = { authenticateJWT, requireAdmin, generateToken };