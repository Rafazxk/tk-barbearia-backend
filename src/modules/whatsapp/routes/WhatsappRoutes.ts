import { Router } from "express";
import { WhatsAppController } from "../controllers/WhatsappController.js";

const whatsappRoutes = Router();

const controller = new WhatsAppController();

whatsappRoutes.post("/test", controller.test);

export { whatsappRoutes }