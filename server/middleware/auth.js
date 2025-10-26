const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Formato: Bearer TOKEN
        
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido' });
            }
            
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: 'Token de autenticación requerido' });
    }
};

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.permissions.includes('admin')) {
        next();
    } else {
        res.status(403).json({ error: 'Se requieren permisos de administrador' });
    }
};

// Generar token JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            email: user.email,
            permissions: user.permissions 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = { authenticateJWT, requireAdmin, generateToken };