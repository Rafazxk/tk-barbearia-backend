import { Router } from "express";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";
import { type Request, type Response } from 'express';

const scheduleBlocksRoutes = Router();
const repository = new ScheduleBlocksRepository();

scheduleBlocksRoutes.get("/", async (req: Request, res: Response, next: Function) => {
  try {
    const data = await repository.findAll();
    return res.json(data);
  } catch (e) { next(e); }
});

scheduleBlocksRoutes.post("/", async (req: Request, res: Response, next: Function) => {
  try {
const { tipo, descricao, dataInicio, horaInicio, horaFim, barbeiroId } = req.body;

const blockData = {
  tipo,
  descricao,
  dataInicio,
  // Se for vazio ou undefined, envie null
  horaInicio: (horaInicio && horaInicio !== "") ? horaInicio : null,
  horaFim: (horaFim && horaFim !== "") ? horaFim : null,
  // Se for vazio, undefined ou "null", envie null. Se for número, converta.
  barbeiroId: (barbeiroId && barbeiroId !== "" && barbeiroId !== "null") ? Number(barbeiroId) : null,
};

    const item = await repository.create(blockData);
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

scheduleBlocksRoutes.delete("/:id", async (req: Request, res: Response, next: Function) => {
  try {
    await repository.delete(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

export { scheduleBlocksRoutes };