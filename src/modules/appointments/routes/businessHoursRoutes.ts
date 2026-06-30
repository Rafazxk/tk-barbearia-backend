import { Router } from "express";
import { BusinessHoursRepository } from "../repositories/BusinessHoursRepository.js";

const businessHoursRoutes = Router();
const repository = new BusinessHoursRepository();

businessHoursRoutes.get("/", async (req, res, next) => {
  try {
    const barbeiroId = req.query.barbeiroId ? Number(req.query.barbeiroId) : null;
    const data = await repository.getSchedule(barbeiroId);
    return res.json(data);
  } catch (e) { next(e); }
});

businessHoursRoutes.put("/", async (req, res, next) => {
  try {
    const { configs, barbeiroId } = req.body; // Recebe o array inteiro e o ID do barbeiro correspondente
    
    for (const dia of configs) {
      await repository.upsertDayConfig({
        id: dia.id,
        barbeiroId: barbeiroId ? Number(barbeiroId) : null,
        diaSemana: dia.diaSemana,
        diaNome: dia.diaNome,
        trabalha: dia.trabalha,
        horaAbertura: dia.horaAbertura,
        horaFechamento: dia.horaFechamento,
        intervaloMinutos: dia.intervaloMinutos
      });
    }
    return res.sendStatus(200);
  } catch (e) { next(e); }
});

export { businessHoursRoutes };