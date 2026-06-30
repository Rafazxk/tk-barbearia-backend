import { type Request, type Response } from "express";
import { WhatsappService } from "../domain/WhatsappService.js";
import { WhatsappRepository } from "../repositories/whatsappRepository.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export class WhatsappController {
  private whatsappRepository = new WhatsappRepository();
  private whatsappService = new WhatsappService(this.whatsappRepository);

  getSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 🔹 Lemos o user usando a nossa interface garantida
      const barberId = req.user?.id; 
      
      if (!barberId) {
        return res.status(401).json({ error: "Barbeiro não autenticado ou sessão inválida." });
      }

      const settings = await this.whatsappService.getSettings(barberId);
      return res.json(settings);
    } catch (err) {
      console.error("Erro no GET whatsapp-settings:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  };

  updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const barberId = req.user?.id;
      
      if (!barberId) {
        return res.status(401).json({ error: "Barbeiro não autenticado ou sessão inválida." });
      }

      const settings = await this.whatsappService.updateSettings(barberId, req.body);
      return res.json(settings);
    } catch (err) {
      console.error("Erro no PATCH whatsapp-settings:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  };
}