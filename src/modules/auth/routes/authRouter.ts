import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthService } from "../domain/AuthService.js";
import { BarbersRepository } from "../repositories/BarbersRepository.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import axios from "axios";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = Router();

const uploadDir = path.resolve("uploads"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });


authRouter.post("/upload-avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
  
  const fotoUrl = `/uploads/${req.file.filename}`;

  try {
    // ⚡ CORREÇÃO AQUI: Pegando o ID de dentro do objeto 'user' que seu middleware preenche
    const barberId = (req as any).user?.id; 

    if (!barberId) {
      return res.status(401).json({ error: "Usuário não autorizado pelo sistema." });
    }

    // Chama o Drizzle para salvar no banco de dados
    await barbersRepository.updateFoto(barberId, fotoUrl);

    // Retorna a URL da foto para o front-end atualizar a imagem circular
    return res.json({ fotoUrl });
  } catch (error) {
    console.error("Erro ao atualizar foto no banco:", error);
    return res.status(500).json({ error: "Erro ao salvar foto de perfil." });
  }
});

const barbersRepository = new BarbersRepository();
const authService = new AuthService(barbersRepository);
const authController = new AuthController(authService);

// Rotas públicas de autenticação
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/google", authController.loginWithGoogle);

authRouter.get("/barbers", authController.listBarbers);

export { authRouter };