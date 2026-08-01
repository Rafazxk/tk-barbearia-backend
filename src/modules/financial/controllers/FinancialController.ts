// backend/src/controllers/financial.controller.ts
import type { Request, Response } from 'express';
import { FinancialService } from '../domain/FinancialService.js';

const financialService = new FinancialService();

export async function getRecebimentosHandler(req: Request, res: Response) {
  console.log("Rota /appointments/recebimentos foi chamada! Query params:", req.query);
  try {
    const { startDate, endDate, barberId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "As datas de início e fim são obrigatórias." });
    }

    const data = await financialService.getRecebimentos({
      startDate: String(startDate),
      endDate: String(endDate),
      barberId: barberId ? Number(barberId) : undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("ERRO INTERNO NO GET RECEBIMENTOS:", error);
    return res.status(400).json({ message: error.message || "Erro ao buscar recebimentos." });
  }
}

export async function exportExcelHandler(req: Request, res: Response) {
  try {
    const { startDate, endDate, barberId, minValor } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "As datas de início e fim são obrigatórias." });
    }

    const buffer = await financialService.exportRecebimentosToExcel(
      String(startDate),
      String(endDate),
      barberId ? Number(barberId) : undefined,
      minValor ? Number(minValor) : undefined
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio-${startDate}-a-${endDate}.xlsx`
    );

    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("ERRO AO EXPORTAR EXCEL:", error);
    return res.status(400).json({ message: error.message || "Erro ao gerar arquivo Excel." });
  }
}

export async function getSummaryHandler(req: Request, res: Response) {
  try {
    const { barberId } = req.query;
    const summary = await financialService.getSummary(barberId ? Number(barberId) : undefined);
    return res.status(200).json(summary);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Erro ao buscar resumo." });
  }
}