import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http"; // 🔌 Importação necessária para o Socket
import { appointmentRoutes } from "./modules/appointments/routes/appointmentRoutes.js";
import { authRouter } from "./modules/auth/routes/authRouter.js"; 
import { whatsappRoutes } from "./modules/whatsapp/routes/WhatsappRoutes.js";
import { SocketService } from "./shared/SocketService.js"; // ⚡ Seu serviço de socket
import { categoryRoutes } from "./modules/appointments/routes/categoriesRoutes.js";
import { productRoutes } from "./modules/appointments/routes/productsRoutes.js";
import { scheduleBlocksRoutes } from "./modules/appointments/routes/scheduleBlocksRoutes.js";
import { businessHoursRoutes } from "./modules/appointments/routes/businessHoursRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔌 Criamos o servidor HTTP envelopando o Express
const httpServer = createServer(app);

// 🌐 1. Lista de origens permitidas (Local e Produção)
const allowedOrigins = [
  "http://localhost:5173",
  "https://tk-barbearia.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado pelo CORS: Origem não permitida."));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());
app.use(cookieParser());

// ⚡ INICIALIZA O SOCKET.IO ATRELADO AO SERVIDOR HTTP
// Passamos a lista de origens permitidas para o Socket também não dar erro de CORS
SocketService.init(httpServer, allowedOrigins);

// Rotas do Sistema
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRouter); 
app.use("/api/barber", whatsappRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/schedule-blocks", scheduleBlocksRoutes);
app.use("/api/business-hours", businessHoursRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "online", message: "Servidor voando baixo!" });
});

// 🚨 IMPORTANTE: Agora quem escuta a porta é o 'httpServer', não mais o 'app'
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor e WebSockets voando baixo na porta: ${PORT}`);
});