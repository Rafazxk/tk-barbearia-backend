import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthService } from "../domain/AuthService.js";
import { BarbersRepository } from "../repositories/BarbersRepository.js";
import multer from "multer";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createClient } from "@supabase/supabase-js";

const authRouter = Router();

// 1. Inicializa o cliente do Supabase (Substitua ou use suas variáveis de ambiente)
const SUPABASE_URL = process.env.SUPABASE_URL || "SUA_URL_DO_SUPABASE";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "SUA_CHAVE_ANON_DO_SUPABASE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Configura o Multer para manter o arquivo na memória RAM temporariamente
const storage = multer.memoryStorage();
const upload = multer({ storage });

authRouter.post("/upload-avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
  
  try {
    const barberId = (req as any).user?.id; 
    if (!barberId) {
      return res.status(401).json({ error: "Usuário não autorizado pelo sistema." });
    }

    const file = req.file;
    // Cria um nome único usando timestamp para evitar sobreposição de arquivos
    const fileName = `avatar-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

    // 3. Envia o buffer direto para o bucket público do Supabase
    const { data, error: uploadError } = await supabase.storage
      .from("avatars") // Certifique-se de que o nome do bucket criado no Supabase é esse
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error("Erro no upload para o Supabase Storage:", uploadError);
      return res.status(500).json({ error: "Falha ao enviar a imagem para o storage remoto." });
    }

    // 4. Pega a URL pública permanente gerada pelo Supabase
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // 5. Salva a URL da internet (publicUrl) direto no banco usando seu repositório do Drizzle
    await barbersRepository.updateFoto(barberId, publicUrl);

    // Retorna a URL permanente para o frontend atualizar a imagem da tela
    return res.json({ fotoUrl: publicUrl });
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