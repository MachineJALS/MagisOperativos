// server/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./config/passport');
const fileRoutes = require('./routes/files');
const path = require('path');
const mediaRoutes = require('./routes/media');
const nodeRoutes = require('./routes/nodes'); // ✅ Ya está importado

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verificar que las variables se cargaron
console.log('🔍 VARIABLES CARGADAS EN SERVER:');
console.log('CLIENT_URL:', process.env.CLIENT_URL || '❌ NO CONFIGURADO');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
console.log('PORT:', process.env.PORT);

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORREGIDO: Middlewares en orden correcto
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001', // ⚠️ Cambié a 3001 para el cliente
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 día
    }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Importar rutas
const authRoutes = require('./routes/auth');

// ✅ CORREGIDO: Usar rutas con sus controladores
app.use('/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/nodes', nodeRoutes); // ✅ AGREGADO el segundo parámetro

// Rutas básicas de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Servidor MAGISOPERATIVOS funcionando!',
        version: '1.0.0',
        endpoints: {
            auth: '/auth/google',
            files: '/api/files',
            media: '/api/media',
            nodes: '/api/nodes',
            health: '/health'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check mejorado
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'MAGISOPERATIVOS Server',
        authenticated: !!req.user,
        user: req.user ? req.user.email : 'No autenticado',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

// Ruta no encontrada
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        availableEndpoints: ['/auth/google', '/health', '/api/files', '/api/media', '/api/nodes']
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🎯 Servidor MAGISOPERATIVOS corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Autenticación Google: http://localhost:${PORT}/auth/google`);
    console.log(`👤 Ver perfil: http://localhost:${PORT}/auth/profile`);
});

module.exports = app;