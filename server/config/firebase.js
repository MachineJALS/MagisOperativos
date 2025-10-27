const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Función para encontrar el archivo de servicio de Firebase
function findFirebaseServiceAccount() {
    const possiblePaths = [
        // Tu archivo específico
        path.join(__dirname, '../../magisoperativos-226d4-firebase-adminsdk-fbsvc-fab1d5a3be.json'),
        // Archivo por defecto
        path.join(__dirname, '../../firebase-service-account.json'),
        // Desde variable de entorno
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) : null
    ].filter(Boolean);

    for (const serviceAccountPath of possiblePaths) {
        if (fs.existsSync(serviceAccountPath)) {
            console.log(`✅ Encontrado archivo de Firebase: ${serviceAccountPath}`);
            return serviceAccountPath;
        }
    }
    
    // Si no encuentra archivo, usar variables de entorno
    if (process.env.FIREBASE_PRIVATE_KEY) {
        console.log('✅ Usando credenciales de Firebase desde variables de entorno');
        return null;
    }
    
    throw new Error('No se encontró el archivo de credenciales de Firebase. Coloca el archivo JSON en la raíz del proyecto.');
}

// Cargar credenciales desde archivo JSON o variables de entorno
let serviceAccount;
if (process.env.FIREBASE_PRIVATE_KEY) {
    // Desde variables de entorno
    serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
} else {
    // Desde archivo JSON
    const serviceAccountPath = findFirebaseServiceAccount();
    if (serviceAccountPath) {
        serviceAccount = require(serviceAccountPath);
    } else {
        throw new Error('No se pudieron cargar las credenciales de Firebase');
    }
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('✅ Firebase configurado correctamente');
} catch (error) {
    if (!error.message.includes('already exists')) {
        console.error('❌ Error configurando Firebase:', error);
        throw error;
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };