import type { Request, Response } from "express";
import { WhatsappService } from "../../whatsapp/domain/WhatsappService.js";

export class WhatsAppController {

  constructor(
    private readonly whatsappService: WhatsappService
  ) {}

  async test(req: Request, res: Response) {

    try {

      await this.whatsappService.sendText(
        "5581983084006",
        "🚀 Teste enviado pelo backend da barbearia!"
      );

      return res.status(200).json({
        success: true,
        message: "Mensagem enviada!"
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        error
      });

    }

  }

}