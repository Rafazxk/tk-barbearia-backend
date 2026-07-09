import  type { Request, Response } from "express";
import { EvolutionClient } from "../infrastructure/evolution/EvolutionClient.js";

export class WhatsAppController {
  async test(req: Request, res: Response) {
    try {
      const client = new EvolutionClient();

      await client.post(
        `/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
        {
          number: "5581983084006", 
          text: "🚀 Teste enviado pelo backend da barbearia!"
        }
      );

      return res.json({
        success: true,
        message: "Mensagem enviada!"
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json(error);
    }
  }
}