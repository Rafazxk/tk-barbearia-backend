import { type Request, type Response } from "express";
import { z } from "zod";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { AppointmentsRepository } from "../repositories/AppointmentsRepository.js";

const ListAppointmentsQueryParams = z.object({
  date: z.string().optional(),
  barberId: z.coerce.number().optional(),
});

const CreateAppointmentBody = z.object({
  clienteNome: z.string().min(1, "Nome é obrigatório"),
  clienteTelefone: z.string().min(1, "Telefone é obrigatório"),
  dataHora: z.string(),
  barbeiroId: z.number(),
  servicoIds: z.array(z.number()).optional(),
});

export class AppointmentController {
  private appointmentsService: AppointmentsService;

  constructor() {
    // Mantendo a injeção clássica que você estruturou
    this.appointmentsService = new AppointmentsService(new AppointmentsRepository());
  }

  list = async (req: Request, res: Response): Promise<Response> => {
    const query = ListAppointmentsQueryParams.safeParse(req.query);
    if (!query.success) return res.status(400).json({ error: query.error.message });

    try {
      // Criamos um filtro limpo sem mutar diretamente o objeto do Zod
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

  create = async (req: Request, res: Response): Promise<Response> => {
    const parsed = CreateAppointmentBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    try {
      // Cria uma cópia com o barbeiro correto baseado no Token se não for Admin
      const appointmentData = {
        ...parsed.data,
        barbeiroId: req.user?.role !== "admin" ? req.user!.id : parsed.data.barbeiroId,
      };

      const result = await this.appointmentsService.createAppointment(appointmentData);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

      const appointment = await this.appointmentsService.getById(id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      if (req.user?.role !== "admin" && appointment.barbeiroId !== req.user?.id) {
        return res.status(403).json({ error: "Você não tem permissão para alterar este agendamento" });
      }

      const result = await this.appointmentsService.updateAppointment(id, req.body);
      return res.json(result);
    } catch (err) {
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
}