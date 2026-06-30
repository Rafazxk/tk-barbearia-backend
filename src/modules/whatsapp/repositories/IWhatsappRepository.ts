// 💡 Como você usa verbatimModuleSyntax, se precisar importar tipos do Drizzle aqui, use 'type'
export interface IWhatsappRepository {
  findByBarberId(barberId: number): Promise<any | null>;
  upsertSettings(
    barberId: number,
    data: {
      receiveAdminNotifications: boolean;
      sendClientNotifications: boolean;
      welcomeMessageTemplate: string;
    }
  ): Promise<any>;
}