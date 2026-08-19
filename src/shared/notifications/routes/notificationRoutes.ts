import { Router } from "express";
import {PushNotificationController } from "../controllers/PushNotificationController.js";
import { PushSubscriptionRepository } from "../repositories/PushSubscriptionRepository.js"
import { PushNotificationService } from "../PushNotificationService.js";
import { BarbersRepository } from "../../../modules/auth/repositories/BarbersRepository.js";

const pushRepository = new PushSubscriptionRepository();
const barbersRepository = new BarbersRepository();

const notificationRoutes = Router();

const pushService = new PushNotificationService(
  pushRepository,
  barbersRepository
);
const pushController = new PushNotificationController(pushService);

// Registro de rota
notificationRoutes.post("/subscribe", pushController.subscribe);





export { notificationRoutes }