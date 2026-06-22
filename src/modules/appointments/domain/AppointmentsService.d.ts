import { type IAppointmentsRepository, type IAppointmentsFilters } from "./IAppointmentsRepository.js";
export declare class AppointmentsService {
    private appointmentsRepository;
    constructor(appointmentsRepository: IAppointmentsRepository);
    private enrich;
    list(filters?: IAppointmentsFilters): Promise<{
        id: any;
        clienteNome: any;
        clienteTelefone: any;
        dataHora: any;
        barbeiroId: any;
        servicos: any[];
        totalPreco: any;
        totalDuracao: any;
    }[]>;
    getById(id: number): Promise<{
        id: any;
        clienteNome: any;
        clienteTelefone: any;
        dataHora: any;
        barbeiroId: any;
        servicos: any[];
        totalPreco: any;
        totalDuracao: any;
    } | null | undefined>;
    createAppointment(data: {
        clienteNome: string;
        clienteTelefone: string;
        dataHora: string;
        barbeiroId: number;
        servicoIds?: number[] | undefined;
    }): Promise<{
        id: any;
        clienteNome: any;
        clienteTelefone: any;
        dataHora: any;
        barbeiroId: any;
        servicos: any[];
        totalPreco: any;
        totalDuracao: any;
    } | undefined>;
    updateAppointment(id: number, body: any): Promise<{
        id: any;
        clienteNome: any;
        clienteTelefone: any;
        dataHora: any;
        barbeiroId: any;
        servicos: any[];
        totalPreco: any;
        totalDuracao: any;
    } | null | undefined>;
    deleteAppointment(id: number): Promise<boolean>;
}
//# sourceMappingURL=AppointmentsService.d.ts.map