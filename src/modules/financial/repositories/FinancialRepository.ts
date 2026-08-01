// backend/src/repositories/financial.repository.ts
import { db, appointmentsTable, appointmentServicesTable, servicesTable } from "../../../database/index.js";
import { eq, and, gte, lte, desc, sum } from "drizzle-orm";
import { DateTime } from "../../../shared/time/DateTime.js";

export async function findRecebimentosByPeriod(startDate: string, endDate: string, barberId?: number) {
  const inicio = DateTime.fromDateOnly(startDate).startOfDay().toDate();
  const fim = DateTime.fromDateOnly(endDate).endOfDay().toDate();

  const conditions = [
    gte(appointmentsTable.dataHora, inicio),
    lte(appointmentsTable.dataHora, fim)
  ];

  if (barberId) {
    conditions.push(eq(appointmentsTable.barbeiroId, barberId));
  }

  const results = await db
    .select({
      id: appointmentsTable.id,
      dataHora: appointmentsTable.dataHora,
      cliente: appointmentsTable.clienteNome,
      valorTotal: sum(servicesTable.preco).as("valorTotal"),
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentServicesTable,
      eq(appointmentServicesTable.appointmentId, appointmentsTable.id)
    )
    .leftJoin(
      servicesTable,
      eq(servicesTable.id, appointmentServicesTable.serviceId)
    )
    .where(and(...conditions))
    .groupBy(appointmentsTable.id, appointmentsTable.clienteNome, appointmentsTable.dataHora)
    .orderBy(desc(appointmentsTable.dataHora));

  return results.map(item => ({
    ...item,
    valorTotal: Number(item.valorTotal || 0)
  }));
}

// Função auxiliar para somar recebimentos em um intervalo genérico
async function getRevenueByDateRange(inicio: Date, fim: Date, barberId?: number) {
  const conditions = [
    gte(appointmentsTable.dataHora, inicio),
    lte(appointmentsTable.dataHora, fim)
  ];

  if (barberId) {
    conditions.push(eq(appointmentsTable.barbeiroId, barberId));
  }

  const [result] = await db
    .select({
      total: sum(servicesTable.preco).as("total")
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentServicesTable,
      eq(appointmentServicesTable.appointmentId, appointmentsTable.id)
    )
    .leftJoin(
      servicesTable,
      eq(servicesTable.id, appointmentServicesTable.serviceId)
    )
    .where(and(...conditions));

  return Number(result?.total || 0);
}

export async function getFinancialSummary(barberId?: number) {
  const now = DateTime.now();

  // Hoje
  const inicioHoje = now.startOfDay().toDate();
  const fimHoje = now.endOfDay().toDate();
  const revenueToday = await getRevenueByDateRange(inicioHoje, fimHoje, barberId);

  // Esta Semana (Início na Segunda-feira ou Domingo, ex: pegando últimos 7 dias ou intervalo padrão)
  const inicioSemana = now.startOfDay();
  // Exemplo simples: semana atual (ajuste conforme a regra do seu negócio)
  const revenueWeek = await getRevenueByDateRange(
    now.startOfDay().toDate(), // Ajuste o range da semana conforme preferir
    fimHoje,
    barberId
  );

  // Este Mês
  const inicioMes = new Date(now.toDate().getFullYear(), now.toDate().getMonth(), 1);
  const fimMes = new Date(now.toDate().getFullYear(), now.toDate().getMonth() + 1, 0, 23, 59, 59);
  const faturamentoMes = await getRevenueByDateRange(inicioMes, fimMes, barberId);

  // Este Ano
  const inicioAno = new Date(now.toDate().getFullYear(), 0, 1);
  const fimAno = new Date(now.toDate().getFullYear(), 11, 31, 23, 59, 59);
  const faturamentoAno = await getRevenueByDateRange(inicioAno, fimAno, barberId);

  return {
    revenueToday,
    revenueWeek,
    faturamentoMes,
    faturamentoAno,
  };
}