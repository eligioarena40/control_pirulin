# 🍫 Control Pirulín - Backend

Sistema full-stack desarrollado para la gestión de inventario, control de entregas, administración de clientes y seguimiento de deudas, optimizado con notificaciones en tiempo real y almacenamiento multimedia en la nube.

---

## 🚀 Tecnologías y Herramientas Utilizadas

* **Entorno de ejecución:** Node.js
* **Framework Backend:** Express.js
* **Base de Datos:** MongoDB & Mongoose
* **Comunicación en Tiempo Real:** Socket.IO
* **Gestión de Archivos y Nube:** Multer & Cloudinary
* **Control de Versiones:** Git & GitHub
* **Pruebas de API:** REST Client (`request.http`)

---

## 📂 Estructura del Proyecto

```text
control_pirulin/
├── backend/
│   ├── controllers/        # Lógica de negocio (clientes, productos, entregas, usuarios)
│   ├── middlewares/        # Middlewares de configuración (ej. subida con Multer/Cloudinary)
│   ├── models/             # Esquemas de Mongoose de la Base de Datos
│   ├── routes/             # Enrutadores de la API REST
│   ├── uploads/            # Archivos locales temporales de prueba
│   ├── server.js           # Archivo principal de arranque del servidor Express y HTTP
│   └── socket.js           # Configuración e inicialización de Socket.IO
├── .env                    # Variables de entorno confidenciales
├── .gitignore              # Archivos excluidos del control de versiones (node_modules, .env, etc.)
├── package.json            # Dependencias y scripts del proyecto
└── request.http            # Pruebas de endpoints HTTP para VS Code