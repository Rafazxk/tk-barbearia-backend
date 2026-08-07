import type { MessageProvider } from "../../domain/interfaces/MessageProvider.js";
import { EvolutionClient } from "./EvolutionClient.js";
import { env } from "../../../../config/env.js";

export class EvolutionProvider
  implements MessageProvider {

  constructor(
    private readonly client: EvolutionClient
  ) {}

  async sendText(
    phone: string,
    message: string
  ): Promise<void> {

    await this.client.post(
      `/message/sendText/${env.evolution.instance}`,
      {
        number: phone,
        text: message
      }
    );

  }

  async sendImage(): Promise<void> {
    throw new Error("Not implemented");
  }

  async isConnected(): Promise<boolean> {

    const response = await this.client.get<any>(
      `/instance/connectionState/${process.env.EVOLUTION_INSTANCE}`
    );

    return response.instance?.state === "open";

  }

}