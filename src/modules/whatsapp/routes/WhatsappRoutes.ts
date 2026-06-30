import { Router } from "express";
import { WhatsappController } from "../controllers/whatsappController.js";
// 🔐 Importe o seu middleware de autenticação real aqui (exemplo abaixo)
import { authMiddleware } from "../../auth/middlewares/authMiddleware.js"; 

const whatsappRoutes = Router();
const controller = new WhatsappController();

whatsappRoutes.use(authMiddleware);

// 📥 Rota para o React Query buscar as configurações atuais (Cards e Template)
// GET http://localhost:3000/api/barber/whatsapp-settings
whatsappRoutes.get("/whatsapp-settings", controller.getSettings);

// 📤 Rota para o Mutation do React Query salvar ou atualizar as configurações
// PATCH http://localhost:3000/api/barber/whatsapp-settings
whatsappRoutes.patch("/whatsapp-settings", controller.updateSettings);

export { whatsappRoutes };