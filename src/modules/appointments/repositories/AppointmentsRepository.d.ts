import { type IAppointmentsRepository, type IAppointmentsFilters } from "../domain/IAppointmentsRepository.js";
export declare class AppointmentsRepository implements IAppointmentsRepository {
    findAll(filters?: IAppointmentsFilters): Promise<{
        id: number;
        clienteNome: string;
        clienteTelefone: string;
        dataHora: Date;
        barbeiroId: number;
        createdAt: Date;
    }[]>;
    findById(id: number): Promise<{
        id: number;
        clienteNome: string;
        clienteTelefone: string;
        dataHora: Date;
        barbeiroId: number;
        createdAt: Date;
    } | null>;
    findServicesByAppointmentId(appointmentId: number): Promise<{
        id: number;
        nome: string;
        preco: string;
        duracaoMinutos: number;
    }[]>;
    create(data: {
        clienteNome: string;
        clienteTelefone: string;
        dataHora: Date;
        barbeiroId: number;
    }): Promise<{
        id: number;
        clienteNome: string;
        clienteTelefone: string;
        dataHora: Date;
        barbeiroId: number;
        createdAt: Date;
    } | undefined>;
    update(id: number, data: any): Promise<{
        id: number;
        clienteNome: string;
        clienteTelefone: string;
        dataHora: Date;
        barbeiroId: number;
        createdAt: Date;
    } | null>;
    delete(id: number): Promise<boolean>;
    linkServices(appointmentId: number, serviceIds: number[]): Promise<void>;
    unlinkServices(appointmentId: number): Promise<void>;
}
//# sourceMappingURL=AppointmentsRepository.d.ts.map