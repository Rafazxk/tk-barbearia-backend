import { Router } from "express";
import { z } from "zod";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { AppointmentsRepository } from "../repositories/AppointmentsRepository.js";
import { ensureAuthenticated } from "../../auth/middleware/ensureAuthenticated.js";

const appointmentsRouter = Router();
const appointmentsService = new AppointmentsService(new AppointmentsRepository());

appointmentsRouter.use(ensureAuthenticated);

// ==========================================
// 🛡️ Validações com o Zod 
// ==========================================
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

// ==========================================
// 🎛️ Rotas HTTP Limpas (Clean Architecture)
// ==========================================

// GET: Listar com filtros opcionais (?date=2026-06-16&barberId=1)
appointmentsRouter.get("/", async (req, res) => {
  const query = ListAppointmentsQueryParams.safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: query.error.message });

  try {

    if(req.user?.role!== "admin") {
      query.data.barberId = req.user?.id;
    }

    const result = await appointmentsService.list(query.data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET: Buscar um agendamento específico por ID
appointmentsRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await appointmentsService.getById(id);
    if (!result) return res.status(404).json({ error: "Appointment not found" });

    if (req.user?.role !== "admin" && result.barbeiroId !== req.user?.id) {
      return res.status(403).json({ error: "Acesso negado a este agendamento" });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: Criar um novo agendamento com serviços atrelados
appointmentsRouter.post("/", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

   try {
      if (req.user?.role !== "admin") {
       parsed.data.barbeiroId = req.user!.id;
    }

    const result = await appointmentsService.createAppointment(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH: Atualizar dados ou serviços de um agendamento existente
appointmentsRouter.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    // Primeiro busca para validar o dono
    const appointment = await appointmentsService.getById(id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user?.role !== "admin" && appointment.barbeiroId !== req.user?.id) {
      return res.status(403).json({ error: "Você não tem permissão para alterar este agendamento" });
    }

    const result = await appointmentsService.updateAppointment(id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE: Remover um agendamento (A tabela intermediária apaga em cascata automaticamente)
appointmentsRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const appointment = await appointmentsService.getById(id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user?.role !== "admin" && appointment.barbeiroId !== req.user?.id) {
      return res.status(403).json({ error: "Você não tem permissão para deletar este agendamento" });
    }

    await appointmentsService.deleteAppointment(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});
 
export { appointmentsRouter };