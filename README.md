# 🍫 Control Pirulín

Sistema full-stack moderno y funcional diseñado para la gestión de clientes, control de entregas, administración de inventario/productos y seguimiento de deudas, optimizado con modales personalizados, notificaciones *toast* y almacenamiento multimedia en la nube.

---

## 🚀 Tecnologías y Herramientas Utilizadas

### **Frontend:**
- **Framework:** React.js (Vite)
- **Estilos:** Tailwind CSS & DaisyUI
- **Iconos:** Lucide React

### **Backend:**
- **Entorno de ejecución:** Node.js
- **Framework Backend:** Express.js
- **Base de Datos:** MongoDB & Mongoose
- **Comunicación en Tiempo Real:** Socket.IO
- **Gestión de Archivos y Nube:** Multer & Cloudinary
- **Autenticación:** JWT (JSON Web Tokens)
- **Control de Versiones:** Git & GitHub
- **Pruebas de API:** REST Client (`request.http`)

---

## 📂 Estructura del Proyecto

```text
control_pirulin/
├── backend/
│   ├── controllers/        # Lógica de negocio (clientes, productos, entregas, pagos)
│   ├── middlewares/        # Middlewares de configuración (ej. subida con Multer/Cloudinary)
│   ├── models/             # Esquemas de Mongoose de la Base de Datos
│   ├── routes/             # Enrutadores de la API REST
│   ├── server.js           # Archivo principal de arranque del servidor Express y HTTP
│   └── socket.js           # Configuración e inicialización de Socket.IO
├── frontend/
│   ├── src/                # Componentes de React, vistas y servicios de API
│   ├── public/             # Archivos estáticos e imágenes
│   └── package.json        # Dependencias del cliente
├── .gitignore              # Archivos excluidos del control de versiones (node_modules, .env, etc.)
└── package.json            # Dependencias y scripts globales