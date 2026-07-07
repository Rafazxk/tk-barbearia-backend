import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentsController.js";
import { authMiddleware } from "../../auth/middlewares/authMiddleware.js";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { AppointmentsRepository } from "../repositories/AppointmentsRepository.js";
import { BusinessHoursRepository } from "..//repositories/BusinessHoursRepository.js";

const appointmentRoutes = Router();

const businessHoursRepository = new BusinessHoursRepository();

const appointmentsRepository = new AppointmentsRepository();
const appointmentsService = new AppointmentsService(appointmentsRepository, businessHoursRepository);

const appointmentController = new AppointmentController(appointmentsService);

// ROTAS PÚBLICAS 

appointmentRoutes.post("/client-booking", appointmentController.createClientBooking);

appointmentRoutes.get(
  "/client/:phone", 
  appointmentController.getClientAppointments
);

// appointmentRoutes.get(
//   "/client/",
//  appointmentController.getClientAppointments
// );

appointmentRoutes.patch("/client/:id", appointmentController.updateClientBooking); // Nova rota de edição pública
appointmentRoutes.delete("/client/:id", appointmentController.deleteClientBooking);

appointmentRoutes.get("/available", (req, res, next) => {
  appointmentController.listAvailable(req, res, next);
});

//  ROTAS PROTEGIDAS - Apenas Barbeiro logado

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