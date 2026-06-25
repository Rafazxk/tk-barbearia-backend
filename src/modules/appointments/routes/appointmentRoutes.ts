import { Router } from "express";
import { AppointmentController } from "../controllers/AppointmentsController.js";
import { authMiddleware } from "../../auth/middleware/authMiddleware.js";

const appointmentRoutes = Router();
const appointmentController = new AppointmentController();

// Protege todas as rotas de agendamento de uma vez só
appointmentRoutes.use(authMiddleware);

appointmentRoutes.get("/", appointmentController.list);

appointmentRoutes.get("/summary", appointmentController.summary);

appointmentRoutes.get("/:id", appointmentController.getById);
appointmentRoutes.post("/", appointmentController.create);
appointmentRoutes.patch("/:id", appointmentController.update);
appointmentRoutes.delete("/:id", appointmentController.delete);

export { appointmentRoutes };