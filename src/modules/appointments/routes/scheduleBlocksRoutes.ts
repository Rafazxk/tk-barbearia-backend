import { Router, type Request, type Response, type NextFunction } from "express";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";

const scheduleBlocksRoutes = Router();
const repository = new ScheduleBlocksRepository();

// Helper para tratar a conversao do barbeiroId com seguranca
function parseBarbeiroId(val: any): number | null {
  if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") {
    return null;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
}

// GET / - Suporta listar todos OU filtrar por data e barbeiro via ?date=YYYY-MM-DD&barberId=X
scheduleBlocksRoutes.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId } = req.query;
    const parsedBarberId = barberId ? Number(barberId) : undefined;

    const data = await repository.findAll(parsedBarberId);
    return res.json(data);
  } catch (e) {
    next(e);
  }
});

// POST / - Criar novo bloqueio
scheduleBlocksRoutes.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tipo, descricao, dataInicio, horaInicio, horaFim, barbeiroId } = req.body;

    if (!tipo || !dataInicio) {
      return res.status(400).json({ error: "Os campos 'tipo' e 'dataInicio' sao obrigatorios." });
    }

    const blockData = {
      tipo,
      descricao: descricao ?? "",
      dataInicio,
      horaInicio: horaInicio && horaInicio !== "" ? horaInicio : null,
      horaFim: horaFim && horaFim !== "" ? horaFim : null,
      barbeiroId: parseBarbeiroId(barbeiroId),
    };

    const item = await repository.create(blockData);
    return res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// PATCH /:id - Atualizar bloqueio
scheduleBlocksRoutes.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalido." });
    }

    const { tipo, descricao, dataInicio, horaInicio, horaFim, barbeiroId } = req.body;

    const blockData = {
      tipo,
      descricao,
      dataInicio,
      horaInicio: horaInicio && horaInicio !== "" ? horaInicio : null,
      horaFim: horaFim && horaFim !== "" ? horaFim : null,
      barbeiroId: parseBarbeiroId(barbeiroId),
    };

    const item = await repository.update(id, blockData);

    return res.json(item);
  } catch (e) {
    next(e);
  }
});

// DELETE /:id - Remover bloqueio
scheduleBlocksRoutes.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalido." });
    }

    await repository.delete(id);
    return res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

export { scheduleBlocksRoutes };