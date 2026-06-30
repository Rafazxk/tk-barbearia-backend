import { type IWhatsappRepository } from "../repositories/IWhatsappRepository.js";
import axios from "axios";

export class WhatsappService {
  // 🔹 O service agora aponta para o tipo da Interface, não para a classe concreta
  private whatsappRepository: IWhatsappRepository;

  // 🔹 Recebe o repositório pelo construtor (Injeção de Dependência)
  constructor(whatsappRepository: IWhatsappRepository) {
    this.whatsappRepository = whatsappRepository;
  }

  async getSettings(barberId: number) {
    let settings = await this.whatsappRepository.findByBarberId(barberId);
    
    if (!settings) {
      return {
        receiveAdminNotifications: false,
        sendClientNotifications: false,
        welcomeMessageTemplate: "Olá {cliente}, seu agendamento para {servico} foi confirmado!"
      };
    }
    return settings;
  }

  async updateSettings(barberId: number, data: any) {
    return await this.whatsappRepository.upsertSettings(barberId, data);
  }

  // ... método triggerNotification continua igual usando o this.whatsappRepository
}