export interface IAppointmentInput {
  clienteNome: string;
  clienteTelefone: string;
  dataHora: Date;
  barbeiroId: number;
}

export interface IAppointmentsFilters {
  date?: string | undefined;
  barberId?: number | undefined;
}

export interface IAppointmentEnriched {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  dataHora: Date;
  barbeiroId: number;
  servicos: {
    id: number;
    nome: string;
    preco: string | number;
    duracaoMinutos: number;
  }[];
  totalPreco: number;
  totalDuracao: number;
}

export interface IDashboardStats {
  appointmentsToday: number;
  revenueToday: string;
  appointmentsThisWeek: number;
}

export interface IAppointmentsRepository {
  findAll(filters?: IAppointmentsFilters): Promise<any[]>;
  findById(id: number): Promise<any | null>;
  findServicesByAppointmentId(appointmentId: number): Promise<any[]>;
  create(data: { clienteNome: string; clienteTelefone: string; dataHora: Date; barbeiroId: number }): Promise<any>;
  update(id: number, data: any): Promise<any | null>;
  delete(id: number): Promise<boolean>;
  linkServices(appointmentId: number, serviceIds: number[]): Promise<void>;
  unlinkServices(appointmentId: number): Promise<void>;
  getStatsToday(barberId: number): Promise<IDashboardStats>;
}