import { AppointmentsService } from "../../../src/modules/appointments/domain/AppointmentsService.js";
import {} from "../../../src/modules/appointments/domain/IAppointmentsRepository.js";
import { describe, it, expect, beforeEach, vi } from "vitest";
describe("AppointmentsService - Testes Unitários", () => {
    let appointmentsRepositoryMock;
    let appointmentsService;
    beforeEach(() => {
        // Criamos um objeto falso que imita perfeitamente o nosso contrato (Interface)
        appointmentsRepositoryMock = {
            findAll: vi.fn(),
            findById: vi.fn(),
            findServicesByAppointmentId: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            linkServices: vi.fn(),
            unlinkServices: vi.fn(),
        };
        // Injetamos o mock no Service real
        appointmentsService = new AppointmentsService(appointmentsRepositoryMock);
    });
    it("deve calcular o preço total e a duração total corretamente ao listar agendamentos", async () => {
        // DADO QUE (massa de dados mockada)
        const agendamentosFalsos = [
            { id: 1, clienteNome: "Rafael Silva", clienteTelefone: "81999999999", dataHora: new Date(), barbeiroId: 1 }
        ];
        const servicosFalsos = [
            { id: 10, nome: "Corte Degradê", preco: "45.00", duracaoMinutos: 30 },
            { id: 11, nome: "Barba Alinhada", preco: "25.00", duracaoMinutos: 20 }
        ];
        // Ensinamos o Mock como reagir quando o Service chamá-lo
        vi.mocked(appointmentsRepositoryMock.findAll).mockResolvedValue(agendamentosFalsos);
        vi.mocked(appointmentsRepositoryMock.findServicesByAppointmentId).mockResolvedValue(servicosFalsos);
        // QUANDO (executamos o método do Service)
        const result = await appointmentsService.list();
        const [primeiroAgendamento] = result;
        // ENTÃO (as asserções/validações da regra de negócio)
        expect(result).toHaveLength(1);
        expect(primeiroAgendamento.totalPreco).toBe(70); // 45 + 25
        expect(primeiroAgendamento.totalDuracao).toBe(50); // 30 + 20
        expect(primeiroAgendamento.clienteNome).toBe("Rafael Silva");
    });
    it("deve retornar null se o agendamento não for encontrado por ID", async () => {
        // GIVEN (Dizemos que o "banco" vai retornar null na busca)
        vi.mocked(appointmentsRepositoryMock.findById).mockResolvedValue(null);
        // WHEN (Tentamos buscar o ID 999 que não existe)
        const result = await appointmentsService.getById(999);
        // THEN (O resultado esperado do Service deve ser estritamente null)
        expect(result).toBeNull();
    });
});
//# sourceMappingURL=AppointmentsService.spec.js.map