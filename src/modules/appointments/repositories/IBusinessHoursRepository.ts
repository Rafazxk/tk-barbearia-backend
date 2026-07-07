export interface IBusinessHoursInput {
  id?: number;
  barbeiroId: number | null;
  diaSemana: number;
  diaNome: string;
  trabalha: boolean;
  horaAbertura: string;
  horaFechamento: string;
  intervaloMinutos: number;
}

export interface IBusinessHoursRepository {
  getSchedule(barbeiroId: number | null): Promise<any>;
  upsertDayConfig(dados: IBusinessHoursInput): Promise<void>;
}