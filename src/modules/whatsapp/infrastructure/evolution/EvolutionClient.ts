import axios from "axios";
import { env } from "../../../../config/env.js";

export class EvolutionClient {

  private readonly api = axios.create({
  baseURL: env.evolution.apiUrl,
  headers: {
    apikey: env.evolution.apiKey,
  },
});

  async post<T>(
    url: string,
    body: unknown
  ): Promise<T> {

    const { data } = await this.api.post<T>(
      url,
      body
    );

    return data;
  }

  async get<T>(
    url: string
  ): Promise<T> {

    const { data } = await this.api.get<T>(url);

    return data;
  }

}