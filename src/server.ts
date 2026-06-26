import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { appointmentRoutes } from "./modules/appointments/routes/appointmentRoutes.js";
import { authRouter } from "./modules/auth/routes/authRouter.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🌐 1. Lista de origens permitidas (Local e Produção)
const allowedOrigins = [
  "http://localhost:5173",
  "https://tk-barbearia.vercel.app",
  "https://tk-barbearia-9vq9otdks-rafazxks-projects.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Se não houver origem (ex: ferramentas de teste) ou se a origem estiver na lista, permite
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(new Error("Bloqueado pelo CORS: Origem não permitida."));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());
app.use(cookieParser());

// Rotas do Sistema
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRouter); 

app.get("/api/health", (req, res) => {
  res.json({ status: "online", message: "Servidor voando baixo!" });
});

// ✅ Ajustado o log para exibir a porta dinâmica injetada pela Railway
app.listen(PORT, () => {
  console.log(`🚀 Servidor voando baixo na porta: ${PORT}`);
});