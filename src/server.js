import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
// Importamos o controller que criamos com toda a lógica de Clean Architecture
import { appointmentsRouter } from "./modules/appointments/controllers/AppointmentsController.js";
import { authRouter } from "./modules/auth/routes/authRouter.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// Middlewares obrigatórios
app.use(cors({
    origin: "http://localhost:5173", // URL do Frontend (Vite)
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// 🚀 Aqui está o segredo: Plugamos o roteador completo!
// Isso significa que tudo que começar com /api/appointments vai usar o nosso Controller
app.use("/api/appointments", appointmentsRouter);
// autenticação 
app.use("/api/auth", authRouter);
// Rota simples de Health Check (Apenas para saber se o app não caiu)
app.get("/api/health", (req, res) => {
    res.json({ status: "online", message: "Servidor voando baixo!" });
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map