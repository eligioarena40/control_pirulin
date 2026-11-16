import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// Importar la función para inicializar el socket globalmente
import { initSocket } from './socket.js';

import productoRoutes from './routes/productoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import entregaRoutes from './routes/entregaRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import pagoRoutes from './routes/pagoRoutes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configuración de Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*", // luego lo restringiremos a la URL
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ⚡ Inicializamos el socket globalmente pasando la instancia de `io` correctamente
initSocket(io);

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pagos', pagoRoutes);

// Ruta de prueba en consola/navegador
app.get("/api/health", (req, res) => {
  res.json({
    status: "Ok",
    mensaje: "Servidor de Control Pirulin funcionando",
  });
});

// Conexión a MongoDB y arranque del servidor
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Conectado exitosamente a MongoDB");
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error conectando a MongoDB:", error.message);
  });