const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('./firebase');

console.log('🔐 Inicializando Passport...');

// Verificar que las variables de entorno estén presentes
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ ERROR: Variables de Google OAuth no encontradas');
  console.error('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
  console.error('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌');
  throw new Error('Google OAuth credentials missing in environment variables');
}

console.log('🔐 Configurando Google OAuth...');
console.log('📍 CLIENT_URL:', process.env.CLIENT_URL);

// Configurar estrategia de Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('📧 Perfil de Google recibido:', profile.emails[0].value);
    
    // Buscar usuario existente
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', profile.emails[0].value).get();
    
    let user;
    
    if (snapshot.empty) {
      // Crear nuevo usuario
      const newUser = {
        oauthId: profile.id,
        email: profile.emails[0].value,
        profile: {
          name: profile.displayName,
          avatar: profile.photos[0]?.value || ''
        },
        permissions: ["read", "write", "share"],
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const docRef = await usersRef.add(newUser);
      user = { id: docRef.id, ...newUser };
      console.log('✅ Nuevo usuario creado:', user.email);
    } else {
      // Usuario existente - actualizar último login
      snapshot.forEach(doc => {
        user = { id: doc.id, ...doc.data() };
        usersRef.doc(doc.id).update({
          lastLogin: new Date()
        });
      });
      console.log('✅ Usuario existente:', user.email);
    }
    
    return done(null, user);
  } catch (error) {
    console.error('❌ Error en autenticación Google:', error);
    return done(error, null);
  }
}));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario de la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (userDoc.exists) {
      done(null, { id: userDoc.id, ...userDoc.data() });
    } else {
      done(new Error('Usuario no encontrado'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

console.log('✅ Passport configurado correctamente');

module.exports = passport;