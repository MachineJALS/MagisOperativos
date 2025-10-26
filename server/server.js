const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('./config/passport');

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
    secret: process.env.JWT_SECRET,
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

// Usar rutas
app.use('/auth', authRoutes);

// Rutas básicas de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Servidor MAGISOPERATIVOS funcionando!',
        version: '1.0.0',
        endpoints: {
            auth: '/auth/google',
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
        availableEndpoints: ['/auth/google', '/health']
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