// backend/src/services/financial.service.ts
import ExcelJS from 'exceljs';
import * as financialRepository from '../repositories/FinancialRepository.js';
import { DateTime } from "../../../shared/time/DateTime.js";

interface IGetRecebimentosDTO {
  startDate: string;
  endDate: string;
  barberId?: number | undefined;
}

export class FinancialService {
  async getSummary(barberId?: number) {
    return await financialRepository.getFinancialSummary(barberId);
  }

  async getRecebimentos({ startDate, endDate, barberId }: IGetRecebimentosDTO) {
    const rawRecebimentos = await financialRepository.findRecebimentosByPeriod(
      startDate,
      endDate,
      barberId
    );

    let totalPeriodo = 0;

    const items = rawRecebimentos.map((item: any) => {
      const valor = Number(item.valorTotal || 0);
      totalPeriodo += valor;

      const dt = DateTime.fromDate(item.dataHora);
      const dataFormatada = dt.toDate().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Recife",
      });

      return {
        id: item.id,
        dataHoraOriginal: item.dataHora,
        data: dataFormatada,
        cliente: item.cliente,
        servico: "Serviço Realizado",
        valor: valor,
      };
    });

    return {
      items,
      totalPeriodo,
    };
  }

  async exportRecebimentosToExcel(startDate: string, endDate: string, barberId?: number, minValor?: number) {
    const resultado = await this.getRecebimentos({ startDate, endDate, barberId });
    let dados = resultado.items;

    // Filtra por valor mínimo caso tenha sido informado no modal
    if (minValor !== undefined && !isNaN(minValor)) {
      dados = dados.filter((item: any) => item.valor >= minValor);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recebimentos');

    worksheet.columns = [
      { header: 'ID Agendamento', key: 'id', width: 15 },
      { header: 'Data/Hora', key: 'dataHora', width: 22 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Valor Total (R$)', key: 'valorTotal', width: 18 },
    ];

    let somaTotal = 0;

    dados.forEach((item: any) => {
      somaTotal += Number(item.valor || 0);
      worksheet.addRow({
        id: item.id,
        dataHora: new Date(item.dataHoraOriginal).toLocaleString('pt-BR', {
          timeZone: "America/Recife",
        }),
        cliente: item.cliente,
        valorTotal: item.valor,
      });
    });

    // Adiciona uma linha em branco para espaçamento (opcional)
    worksheet.addRow({});

    // Adiciona a linha de somatório
    const totalRow = worksheet.addRow({
      id: 'TOTAL',
      dataHora: '',
      cliente: '',
      valorTotal: somaTotal,
    });

    // Deixa o cabeçalho e a linha de total em negrito
    worksheet.getRow(1).font = { bold: true };
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}