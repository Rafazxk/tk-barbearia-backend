import { Router } from "express";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";

const scheduleBlocksRoutes = Router();
const repository = new ScheduleBlocksRepository();

scheduleBlocksRoutes.get("/", async (req, res, next) => {
  try {
    const data = await repository.findAll();
    return res.json(data);
  } catch (e) { next(e); }
});

scheduleBlocksRoutes.post("/", async (req, res, next) => {
  try {
    const { tipo, descricao, dataInicio, horaInicio, horaFim, barbeiroId } = req.body;
    const item = await repository.create({
      tipo,
      descricao,
      dataInicio,
      horaInicio: tipo === "horario" ? horaInicio : null,
      horaFim: tipo === "horario" ? horaFim : null,
      barbeiroId: barbeiroId ? Number(barbeiroId) : null,
    });
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

scheduleBlocksRoutes.delete("/:id", async (req, res, next) => {
  try {
    await repository.delete(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

export { scheduleBlocksRoutes };