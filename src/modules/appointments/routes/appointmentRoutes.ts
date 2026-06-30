import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentsController.js";
import { authMiddleware } from "../../auth/middlewares/authMiddleware.js";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { AppointmentsRepository } from "../repositories/AppointmentsRepository.js";


const appointmentRoutes = Router();

const appointmentsRepository = new AppointmentsRepository();
const appointmentsService = new AppointmentsService(appointmentsRepository);
const appointmentController = new AppointmentController(appointmentsService);

// ==========================================
// 🔓 ROTAS PÚBLICAS (O cliente acessa sem login)
// ==========================================

// 👇 Adicione a rota que o frontend estava procurando!
appointmentRoutes.post("/client-booking", appointmentController.createClientBooking);

// 👇 Aproveita e já deixa a de buscar agendamentos pelo celular pronta e pública
appointmentRoutes.get("/client/:phone", appointmentController.getClientAppointments);


// ==========================================
// 🔒 ROTAS PROTEGIDAS (Apenas Admin/Barbeiro logado)
// ==========================================
appointmentRoutes.use(authMiddleware);

appointmentRoutes.get("/frequent-clients", (req, res, next) => {
  appointmentController.getFrequentClients(req, res, next);
});

appointmentRoutes.get("/", appointmentController.list);
appointmentRoutes.get("/summary", appointmentController.summary);
appointmentRoutes.get("/:id", appointmentController.getById);
appointmentRoutes.post("/", appointmentController.create);
appointmentRoutes.patch("/:id", appointmentController.update);
appointmentRoutes.delete("/:id", appointmentController.delete);

export { appointmentRoutes };