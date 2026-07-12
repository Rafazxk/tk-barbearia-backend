import { Router } from "express";
import { db } from "../../../database/db.js"; 
import { pushSubscriptions } from "../../../database/schema/notification.js";

const notificationRoutes = Router();

notificationRoutes.post("/subscribe", async (req, res) => {
  try {
    const { barberId, subscription } = req.body;
    
    await db.insert(pushSubscriptions).values({
      barberId,
      subscriptionData: JSON.stringify(subscription)
    });
    
    res.status(201).json({ message: "Inscrito com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar subscrição:", error);
    res.status(500).json({ error: "Erro ao salvar subscrição" });
  }
});

export { notificationRoutes };