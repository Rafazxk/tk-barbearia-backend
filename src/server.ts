import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http"; 
import { appointmentRoutes } from "./modules/appointments/routes/appointmentRoutes.js";
import { authRouter } from "./modules/auth/routes/authRouter.js"; 

import { whatsappRoutes } from "./modules/whatsapp/routes/WhatsappRoutes.js";

import { SocketService } from "./shared/SocketService.js"; 
import { categoryRoutes } from "./modules/appointments/routes/categoriesRoutes.js";
import { productRoutes } from "./modules/appointments/routes/productsRoutes.js";
import { scheduleBlocksRoutes } from "./modules/appointments/routes/scheduleBlocksRoutes.js";
import { businessHoursRoutes } from "./modules/appointments/routes/businessHoursRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://tk-barbearia.vercel.app",
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite conexões sem origem (ex: mobile apps, ferramentas de API, ou requisições internas)
    if (!origin) return callback(null, true);
    
    // Log para você ver o que está acontecendo no log do Render
    console.log("Tentativa de acesso de origem:", origin);

    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Em vez de jogar um erro que quebra a requisição, vamos apenas logar e negar
      console.error("CORS Bloqueado para:", origin);
      callback(new Error("Bloqueado pelo CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

SocketService.init(httpServer, allowedOrigins);

app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRouter); 
app.use("/whatsapp", whatsappRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/schedule-blocks", scheduleBlocksRoutes);
app.use("/api/business-hours", businessHoursRoutes);


app.get("/api/health", (req, res) => {
  res.json({ status: "online", message: "Servidor voando baixo!" });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor e WebSockets voando baixo na porta: ${PORT}`);
});