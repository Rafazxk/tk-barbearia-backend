import { Router } from "express";
import {PushNotificationController } from "../controllers/PushNotificationController.js";
import { PushSubscriptionRepository } from "../repositories/PushSubscriptionRepository.js"
import { PushNotificationService } from "../PushNotificationService.js";

const pushRepository = new PushSubscriptionRepository();
const pushService = new PushNotificationService(pushRepository);
const pushController = new PushNotificationController(pushService);

const notificationRoutes = Router();

// Registro de rota
notificationRoutes.post("/subscribe", pushController.subscribe);

export { notificationRoutes }