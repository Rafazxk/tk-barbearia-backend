import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { error } from "console";

const SummaryQueryParams = z.object({
  barberId: z.coerce.number({ message: "barberId precisa ser um número válido" })
});

const ListAppointmentsQueryParams = z.object({
  date: z.string().optional(),
  barberId: z.coerce.number().optional(),
});

// Schema original do Admin
const CreateAppointmentBody = z.object({
  clienteNome: z.string().min(1, "Nome é obrigatório"),
  clienteTelefone: z.string().min(1, "Telefone é obrigatório"),
  dataHora: z.string(),
  barbeiroId: z.number(),
  servicoIds: z.array(z.number()).optional(),
});

// 👇 1. NOVO SCHEMA: Customizado para receber os produtos que o cliente escolhe na Home
const CreateClientBookingBody = z.object({
  clienteNome: z.string().min(1, "Nome é obrigatório"),
  clienteTelefone: z.string().min(1, "Telefone é obrigatório"),
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  
  // 👑 COERCE: Transforma string "1" em número 1 automaticamente se o front vacilar
  barbeiroId: z.coerce.number({ message: "barbeiroId precisa ser um número válido" }),
  
  // Tolera receber array de IDs numéricos ou convertidos
  servicoIds: z.array(z.coerce.number()).default([]),
  
  // Deixa o objeto de produtos blindado e opcional
  produtosReservados: z.array(
    z.object({
      id: z.coerce.number(),
      quantidade: z.coerce.number()
    })
  ).optional().default([])
});

export class AppointmentController {
  constructor(private appointmentsService: AppointmentsService) {
    this.listAvailable = this.listAvailable.bind(this);
    this.createClientBooking = this.createClientBooking.bind(this);
  }

  // 👇 2. MÉTODO NOVO: Criação pública vinda do app do cliente


  // 👇 3. MÉTODO NOVO: Busca o histórico pelo WhatsApp do cliente de forma pública
  getClientAppointments = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { phone } = req.params;
      const { barberId } = req.query;
      
      if (!phone || typeof phone !== "string") {
      return res.status(400).json({ error: "Telefone inválido ou não informado." });
    }

              
      // Garanta que seu service implemente esse método de busca por telefone
      const result = await this.appointmentsService.listByClientPhone(phone);

      console.log(JSON.stringify(result, null, 2));
      
      return res.json(result);
    } catch (err: any) {
      console.error("❌ ERRO AO BUSCAR AGENDAMENTOS DO CELULAR:", err);
      return res.status(500).json({ error: "Erro ao carregar histórico." });
    }
  };

  async getFrequentClients(req: Request, res: Response, next: NextFunction) {
    try {
      const { barberId } = req.query;
      const parsedBarberId = barberId ? Number(barberId) : undefined;
      const clients = await this.appointmentsService.getFrequentClients(parsedBarberId);
      return res.json(clients);
    } catch (error) {
      console.error("Erro ao buscar clientes frequentes:", error);
      next(error);
    }
  }

  summary = async (req: Request, res: Response): Promise<Response> => {
    const query = SummaryQueryParams.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: query.error.issues[0]!.message });
    }

    try {
      let targetBarberId = query.data.barberId;
      if (req.user?.role !== "admin" && req.user?.id) {
        targetBarberId = req.user.id;
      }
      const result = await this.appointmentsService.getDashboardSummary(targetBarberId);
      return res.json(result);
    } catch (err) {
      console.error("Erro no summary controller:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = ListAppointmentsQueryParams.safeParse(req.query);
    if (!query.success) return res.status(400).json({ error: query.error.message });

    try {
      const filters = { ...query.data };
      if (req.user?.role !== "admin") {
        filters.barberId = req.user?.id;
      }
      const result = await this.appointmentsService.list(filters);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const result = await this.appointmentsService.getById(id);
      if (!result) return res.status(404).json({ error: "Appointment not found" });

      if (req.user?.role !== "admin" && result.barbeiroId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado a este agendamento" });
      }

      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  // Mantém intacto para criação de agendamento por dentro do Admin
  create = async (req: Request, res: Response): Promise<Response> => {
    const parsed = CreateAppointmentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    try {
      const appointmentData = {
        ...parsed.data,
        barbeiroId: req.user?.role !== "admin" ? req.user!.id : parsed.data.barbeiroId,
      };

      const result = await this.appointmentsService.createAppointment(appointmentData);
      return res.status(201).json({ message: "Agendamento criado com sucesso!", result });
    } catch (err) {
      console.error("ERRO COMPLETO DO BACKEND:", err);
      return res.status(500).json({ error: "Internal server error", details: err });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = Number(req.params.id);

    console.log("Update Appointment ->", { id, body: req.body });

    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Nenhum dado enviado para atualização." });
    }
    // --------------------------------

    const appointment = await this.appointmentsService.getById(id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const result = await this.appointmentsService.updateAppointment(id, req.body);
    return res.json(result);
  } catch (err) {
    console.error("ERRO DETALHADO NO BACKEND:", { error: err });
    return res.status(500).json({ error: "Internal server error" });
  }
};

  delete = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const appointment = await this.appointmentsService.getById(id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      if (req.user?.role !== "admin" && appointment.barbeiroId !== req.user?.id) {
        return res.status(403).json({ error: "Você não tem permissão para deletar este agendamento" });
      }

      await this.appointmentsService.deleteAppointment(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  createClientBooking = async (req: Request, res: Response): Promise<Response> => {
    const parsed = CreateClientBookingBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados de agendamento inválidos", detalhes: parsed.error.format() });
    }

    try {
      // Repassa direto para o service processar o agendamento + reserva de produtos
      const result = await this.appointmentsService.createAppointment(parsed.data);
      return res.status(201).json(result);
    } catch (err: any) {
      console.error("❌ ERRO NO AGENDAMENTO DO CLIENTE:", err);
      return res.status(500).json({ error: "Erro interno ao processar agendamento.", details: err.message });
    }
  };
  
  updateClientBooking = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const appointment = await this.appointmentsService.getById(id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      const result = await this.appointmentsService.updateAppointment(id, req.body);
      return res.json({ message: "Agendamento atualizado com sucesso!", result });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  deleteClientBooking = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
      const appointment = await this.appointmentsService.getById(id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      await this.appointmentsService.deleteAppointment(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async listAvailable(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const { date, barberId } = req.query;
      
      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "Data inválida ou não informada." });
      }
      
      const parsedBarberId = barberId ? Number(barberId) : undefined;

      if (parsedBarberId === undefined || isNaN(parsedBarberId)) {
        return res.status(400).json({ error: "barberId inválido ou não informado." });
      }

      // 🌟 PASSE EXATAMENTE NESSA ORDEM PARA CASAR COM O SEU SERVICE E SANAR O TYPESCRIPT:
      const availableSlots = await this.appointmentsService.listAvailableSlots(parsedBarberId, date);
      
      return res.json(availableSlots);
    } catch (err) {
      console.error("❌ ERRO AO LISTAR HORÁRIOS DISPONÍVEIS:", err);
      return res.status(500).json({ error: "Erro interno ao listar horários disponíveis." });
    }
  }
}