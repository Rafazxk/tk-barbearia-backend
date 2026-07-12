import type { Request, Response } from 'express';
import { PushNotificationService } from '../PushNotificationService.js';

export class PushNotificationController {
  constructor(private service: PushNotificationService) {}

  subscribe = async (req: Request, res: Response) => {
    try {
      const { barberId, subscription } = req.body;
      await this.service.subscribe(barberId, subscription);
      res.status(201).json({ message: "Inscrito com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao realizar inscrição" });
    }
  }
}