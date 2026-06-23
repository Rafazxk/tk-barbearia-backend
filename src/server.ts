import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { appointmentRoutes } from "./modules/appointments/routes/appointmentRoutes.js";
// Corrigido para bater com o export real do módulo de autenticação
import { authRouter } from "./modules/auth/routes/authRouter.js"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173", // URL do Frontend (Vite)
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rotas do Sistema
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRouter); // Ajustado aqui também

app.get("/api/health", (req, res) => {
  res.json({ status: "online", message: "Servidor voando baixo!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});