import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentsController.js";
import { authMiddleware } from "../../auth/middlewares/authMiddleware.js";
import { AppointmentsService } from "../domain/AppointmentsService.js";
import { AppointmentsRepository } from "../repositories/AppointmentsRepository.js";
import { BusinessHoursRepository } from "../repositories/BusinessHoursRepository.js";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";
import { EvolutionClient } from "../../whatsapp/infrastructure/evolution/EvolutionClient.js";
import { EvolutionProvider } from "../../whatsapp/infrastructure/evolution/EvolutionProvider.js";
import { BarbersRepository } from "../../auth/repositories/BarbersRepository.js";
import { WhatsappService } from "../../whatsapp/domain/WhatsappService.js";
import { PushNotificationService } from "../../../shared/notifications/PushNotificationService.js";
import { PushSubscriptionRepository } from "../../../shared/notifications/repositories/PushSubscriptionRepository.js";

const pushRepository = new PushSubscriptionRepository();
const pushService = new PushNotificationService(pushRepository);

const appointmentRoutes = Router();

const businessHoursRepository = new BusinessHoursRepository();
const appointmentsRepository = new AppointmentsRepository();
const scheduleBlocksRepository = new ScheduleBlocksRepository();
const barbersRepository = new BarbersRepository();

const evolutionClient = new EvolutionClient();

const evolutionProvider = new EvolutionProvider(
  evolutionClient
);

const whatsappService = new WhatsappService(
  evolutionProvider
);

const appointmentsService = new AppointmentsService(appointmentsRepository, businessHoursRepository, scheduleBlocksRepository, whatsappService, barbersRepository, pushService);


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