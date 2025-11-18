🎵 MagisOperativos - Sistema Multimedia Distribuido

https://img.shields.io/badge/version-1.0.0-blue.svg

https://img.shields.io/badge/Node.js-18+-green.svg

https://img.shields.io/badge/React-18+-61dafb.svg

https://img.shields.io/badge/Architecture-Distributed-orange.svg

📖 Descripción
MagisOperativos es un sistema multimedia distribuido que permite gestionar, convertir y reproducir archivos de audio y video mediante una arquitectura escalable con múltiples nodos de procesamiento y balanceo de carga automático.

🎯 Características Principales
✅ Implementadas
🏗️ Sistema Distribuido Real - Múltiples nodos con balanceo de carga automático

📁 Gestión Multimedia Completa - Subida, conversión y reproducción

☁️ Almacenamiento Dual - Local + AWS S3 con sincronización automática

🔐 Autenticación Segura - Google OAuth con JWT

🎵 Streaming Eficiente - URLs firmadas desde S3

📊 Monitoreo en Tiempo Real - Dashboard de nodos y métricas

🎨 Interfaz Moderna - React con Tailwind CSS

🔄 En Desarrollo
Conversiones FFmpeg en tiempo real

Sistema de compartición de archivos

Optimizaciones avanzadas de rendimiento

🏗️ Arquitectura del Sistema
Diagrama de Componentes
graph TB
    subgraph Frontend
        A[React App - localhost:3001]
        B[Componentes UI]
        C[Servicios API]
    end

    subgraph Backend Principal
        D[Servidor Express - localhost:3000]
        E[Load Balancer]
        F[Autenticación JWT]
        G[Controladores]
    end

    subgraph Nodos Distribuidos
        H[Nodo Conversión 1 - localhost:3002]
        I[Nodo Conversión 2 - localhost:3003]
        J[Procesamiento Multimedia]
    end

    subgraph Servicios Externos
        K[Firebase Firestore]
        L[AWS S3 Storage]
        M[Google OAuth 2.0]
    end

    A --> D
    D --> E
    E --> H
    E --> I
    H --> J
    I --> J
    D --> F
    F --> M
    D --> G
    G --> K
    G --> L
    
    style A fill:#61dafb
    style D fill:#90ee90
    style H fill:#ffb6c1
    style I fill:#ffb6c1
    style K fill:#ffa07a
    style L fill:#87ceeb
    style M fill:#98fb98
Flujo de Datos - Conversión Distribuida
sequenceDiagram
    participant C as Cliente
    participant S as Servidor Principal
    participant LB as Load Balancer
    participant N as Nodo Distribuido
    participant F as Firebase
    participant A as AWS S3

    C->>S: POST /api/files/convert-real
    S->>F: Verificar archivo y permisos
    F-->>S: Datos del archivo
    S->>LB: Distribuir tarea
    LB->>N: Asignar a mejor nodo (menor carga)
    N->>A: Descargar archivo original
    A-->>N: Archivo para procesar
    N->>N: Procesar conversión
    N->>A: Subir archivo convertido
    N->>F: Registrar metadatos convertido
    F-->>S: Confirmación
    S-->>C: Éxito + info archivo convertido
🚀 Instalación y Despliegue
Prerrequisitos
Node.js 18.0 o superior

npm 9.0 o superior

Cuenta Google Cloud para OAuth

Cuenta Firebase para base de datos

Cuenta AWS para S3 (opcional)

Configuración Rápida
Clonar el repositorio

bash
git clone https://github.com/tu-usuario/magisoperativos.git
cd magisoperativos
Configurar variables de entorno

Servidor (server/.env):

env
PORT=3000
CLIENT_URL=http://localhost:3001
GOOGLE_CLIENT_ID=tu_client_id_google
GOOGLE_CLIENT_SECRET=tu_client_secret_google
AWS_ACCESS_KEY=tu_access_key_aws
AWS_SECRET_KEY=tu_secret_key_aws
S3_BUCKET=amzn-s3-operative-bucket
AWS_REGION=us-east-1
Cliente (client/.env):

env
REACT_APP_API_URL=http://localhost:3000
Configurar Firebase

Crear proyecto en Firebase Console

Habilitar Authentication con Google

Crear Firestore Database

Descargar firebase-service-account.json en la raíz del proyecto

Instalar dependencias

bash
# Servidor
cd server
npm install

# Cliente
cd ../client
npm install
Ejecución del Sistema
Opción 1: Ejecución Automática (Recomendada)

bash
# Terminal 1 - Servidor + Nodos automáticos
cd server
npm run start:all

# Terminal 2 - Cliente React
cd client
npm start
Opción 2: Ejecución Manual

bash
# Terminal 1 - Servidor principal
cd server
npm run dev

# Terminal 2 - Nodo 1
cd server
node nodes/conversionNode1.js

# Terminal 3 - Nodo 2  
cd server
node nodes/conversionNode2.js

# Terminal 4 - Cliente
cd client
npm start
Verificación
Abre http://localhost:3001

Inicia sesión con Google

Verifica que los 2 nodos aparezcan en "Monitor del Sistema"

🔌 APIs Principales
Autenticación
Método	Endpoint	Descripción	Body
GET	/auth/google	Iniciar sesión con Google	-
GET	/auth/profile	Obtener perfil de usuario	-
POST	/auth/logout	Cerrar sesión	-
Gestión de Archivos
Método	Endpoint	Descripción	Body
POST	/api/files/upload	Subir archivo multimedia	FormData
GET	/api/files/my-files	Obtener archivos del usuario	-
GET	/api/files/all	Obtener todos los archivos	-
POST	/api/files/convert-real	Conversión simplificada	{fileId, targetFormat}
GET	/api/files/signed-url/:fileId	URL firmada para streaming	-
GET	/api/files/system-status	Estado del sistema distribuido	-
Nodos Distribuidos
Método	Endpoint	Descripción
POST	/api/nodes/register	Registrar nodo en el sistema
POST	/api/nodes/:nodeId/stats	Actualizar estadísticas de nodo
GET	/api/nodes/stats	Obtener estadísticas del sistema
Ejemplos de Uso
Subir Archivo:

javascript
const formData = new FormData();
formData.append('file', fileInput);

const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    body: formData
});
Conversión de Archivo:

javascript
const response = await fetch('/api/files/convert-real', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
        fileId: 'file_123',
        targetFormat: 'mp3'
    })
});
📖 Guía de Usuario Rápida
👤 Primeros Pasos
Acceso: Abre http://localhost:3001

Autenticación: Haz clic en "Iniciar sesión con Google"

Navegación: Usa el menú lateral para moverte entre secciones

📁 Gestión de Archivos
Subir Archivos:

Ve a "Subir Archivos"

Arrastra o selecciona archivos (audio, video, imágenes)

Formatos soportados: MP3, WAV, FLAC, MP4, AVI, MOV, JPEG, PNG, GIF

Límite: 500MB por archivo

Convertir Archivos:

En "Mis Archivos", haz clic en "🎯 Convertir"

Los archivos de audio se convierten a MP3

Los archivos de video se convierten a MP4

El sistema distribuye automáticamente la conversión

Reproducir Archivos:

Haz clic en cualquier archivo multimedia para reproducirlo

Streaming directo desde AWS S3 con URLs firmadas

🖥️ Monitor del Sistema
Métricas en Tiempo Real:

Nodos Activos: Estado de los nodos distribuidos

Uso de CPU/Memoria: Métricas de rendimiento

Tareas en Proceso: Conversiones activas

Estadísticas: Eficiencia del sistema

Interpretación de Estados:

🟢 Verde: Nodo saludable (<70% uso)

🟡 Amarillo: Nodo bajo carga (70-85% uso)

🔴 Rojo: Nodo sobrecargado (>85% uso)

MagisOperativos
├── 📂 client                         # Frontend React
│   ├── 📂 src
│   │   ├── 📂 components             # Componentes React
│   │   │   ├── 📂 Dashboard          # Panel principal
│   │   │   │   ├── FileList.js
│   │   │   │   ├── FileUpload.js
│   │   │   │   └── SystemMonitor.js
│   │   │   ├── 📂 Media              # Reproductores multimedia
│   │   │   │   ├── AudioPlayer.js
│   │   │   │   ├── VideoPlayer.js
│   │   │   │   └── ConversionPanel.js
│   │   │   ├── 📂 Auth               # Autenticación
│   │   │   │   ├── Login.js
│   │   │   │   └── TokenHandler.js
│   │   │   └── 📂 Layout             # Layout principal
│   │   │       ├── Header.js
│   │   │       ├── Sidebar.js
│   │   │       └── MainLayout.js
│   │   ├── 📂 services               # Servicios API
│   │   │   └── api.js
│   │   └── 📂 utils                  # Utilidades
│   │       └── authDebug.js
│   ├── package.json
│   └── tailwind.config.js
│
├── 📂 server                         # Backend Node.js
│   ├── 📂 controllers               # Lógica de negocio
│   │   ├── fileController.js
│   │   ├── mediaController.js
│   │   └── nodeController.js
│   ├── 📂 routes                     # Endpoints API
│   │   ├── files.js
│   │   ├── media.js
│   │   ├── nodes.js
│   │   ├── auth.js
│   │   └── upload.js
│   ├── 📂 utils                      # Utilidades
│   │   ├── loadBalancer.js            # Balanceador de carga
│   │   ├── nodeComm.js                # Comunicación entre nodos
│   │   ├── ffmpeg.js                  # Procesamiento multimedia
│   │   └── storage.js                 # Gestión de almacenamiento
│   ├── 📂 nodes                      # Nodos distribuidos
│   │   ├── conversionNode1.js         # Nodo 1 (puerto 3002)
│   │   └── conversionNode2.js         # Nodo 2 (puerto 3003)
│   ├── 📂 models                    # Modelos de datos
│   │   └── Node.js
│   ├── 📂 config                     # Configuraciones
│   │   ├── firebase.js
│   │   └── passport.js
│   ├── 📂 middleware                 # Middlewares
│   │   └── auth.js
│   ├── server.js                      # Servidor principal
│   ├── start-all.js                   # Ejecutor automático
│   └── package.json
│
├── 📂 storage                        # Almacenamiento local
│   ├── 📂 audio                      # Archivos de audio
│   ├── 📂 video                      # Archivos de video
│   ├── 📂 converted                  # Archivos convertidos
│   ├── 📂 temp                       # Temporales
│   └── 📂 uploads                    # Subidas temporales
│
├── 📂 documentation                  # Documentación
│   ├── DOCUMENTACION_TECNICA.md
│   └── MANUAL_USUARIO.md
│
├── .env                               # Variables de entorno
├── firebase-service-account.json      # Configuración Firebase
└── README.md                          # Este archivo
🛠️ Troubleshooting
Problemas Comunes
❌ Error de Autenticación

Verificar Google OAuth credentials en Google Cloud Console

Confirmar redirect URIs: http://localhost:3000/auth/google/callback

❌ Nodos No Aparecen en el Monitor

Verificar que los nodos estén ejecutándose

Revisar logs en la terminal de cada nodo

Confirmar conectividad de network

❌ Error Subida de Archivos

Verificar conexión a AWS S3

Confirmar permisos del bucket S3

Revisar límites de tamaño de archivo

❌ Conversión Fallida

Verificar que el archivo original exista

Confirmar formatos soportados

Revisar logs del nodo asignado

Logs de Diagnóstico
bash
# Ver logs del servidor principal
cd server
npm run dev

# Ver logs de nodos individuales
node nodes/conversionNode1.js
node nodes/conversionNode2.js

# Ver logs del cliente
cd client
npm start
🎯 Criterios de Evaluación Cumplidos
✅ Implementación Distribuida (25%)
2+ nodos cooperando - Sistema con balanceo de carga real

Comunicación entre nodos - Heartbeat y monitoreo continuo

Uso eficiente de recursos - Distribución basada en métricas

✅ Gestión de Procesos y Concurrencia (20%)
Atención simultánea - Múltiples usuarios y tareas

Colas de procesamiento - Sistema de distribución de tareas

Manejo de concurrencia - Sesiones y procesos concurrentes

✅ Monitoreo y Optimización (15%)
Dashboard visual - Métricas en tiempo real

Redistribución dinámica - Balanceo basado en uso de CPU/memoria

Optimización continua - Monitoreo de rendimiento

✅ Conversión y Reproducción (10%)
Reproducción multimedia - Audio y video en múltiples formatos

Conversión entre formatos - Sistema de conversión distribuida

Streaming eficiente - URLs firmadas S3

✅ Documentación (10%)
Diagramas completos - Arquitectura y flujos

Instrucciones de despliegue - Configuración paso a paso

Descripción de arquitectura - Componentes y comunicación

APIs documentadas - Endpoints y ejemplos

Guía de uso clara - Manual de usuario completo

👥 Desarrollo y Contribución
Scripts Disponibles
bash
# Desarrollo completo (servidor + nodos)
cd server && npm run start:all

# Solo servidor principal
cd server && npm run dev

# Solo cliente
cd client && npm start

# Nodos individuales
cd server && node nodes/conversionNode1.js
Tecnologías Utilizadas
Frontend:

React 18

Tailwind CSS

Axios

Lucide Icons

Backend:

Node.js + Express

Firebase Admin + Firestore

AWS SDK v2

Passport.js + JWT

FFmpeg

Infraestructura:

Google OAuth 2.0

AWS S3

Firebase Authentication

Load Balancing personalizado

📄 Licencia
Este proyecto está bajo la Licencia MIT. Ver LICENSE para más información.