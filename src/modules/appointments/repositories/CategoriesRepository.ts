import { 
  db, 
  categoriesTable, 
  servicesTable, 
  appointmentServicesTable // 👈 Certifique-se de adicionar essa importação aqui
} from "../../../database/index.js";
import { eq, sql } from "drizzle-orm";

export class CategoriesRepository {
  
  // 🔍 BUSCA TODAS AS CATEGORIAS TRAZENDO OS SERVIÇOS JUNTOS
  async findAllEnriched() {
    const rows = await db
      .select({
        categoriaId: categoriesTable.id,
        categoriaNome: categoriesTable.nome,
        servicoId: servicesTable.id,
        servicoNome: servicesTable.nome,
        servicoDuracao: servicesTable.duracaoMinutos,
        servicoPreco: servicesTable.preco,
      })
      .from(categoriesTable)
      .leftJoin(servicesTable, eq(servicesTable.categoriaId, categoriesTable.id))
      .orderBy(categoriesTable.nome, servicesTable.nome);
      
    // 🔄 Agrupa o retorno do banco no formato aninhado que o Frontend espera
    const categoriasMap = new Map<number, any>();

    for (const row of rows) {
      if (!categoriasMap.has(row.categoriaId)) {
        categoriasMap.set(row.categoriaId, {
          id: String(row.categoriaId),
          nome: row.categoriaNome,
          servicos: [],
        });
      }

      if (row.servicoId) {
        categoriasMap.get(row.categoriaId).servicos.push({
          id: String(row.servicoId),
          nome: row.servicoNome,
          duracao: row.servicoDuracao,
          preco: Number(row.servicoPreco),
        });
      }
    }

    return Array.from(categoriasMap.values());
  }


  async reorderItems(type: "categories" | "services", orderedIds: string[]) {
    if (type === "categories") {
      for (let index = 0; index < orderedIds.length; index++) {
        await db
          .update(categoriesTable)
          .set({ ordem: index })
          .where(eq(categoriesTable.id, Number(orderedIds[index])));
      }
    } else if (type === "services") {
      for (let index = 0; index < orderedIds.length; index++) {
        await db
          .update(servicesTable)
          .set({ ordem: index })
          .where(eq(servicesTable.id, Number(orderedIds[index])));
      }
    }
    return true;
  }
  
  // 📝 OPERAÇÕES DE CATEGORIA
  async createCategory(nome: string) {
    const [newCategory] = await db.insert(categoriesTable).values({ nome }).returning();
    return newCategory;
  }

  async deleteCategory(id: number) {
    // A) Primeiro, precisamos descobrir quais serviços pertencem a essa categoria
    const servicesToClean = await db
      .select({ id: servicesTable.id })
      .from(servicesTable)
      .where(eq(servicesTable.categoriaId, id));

    const serviceIds = servicesToClean.map(s => s.id);

    if (serviceIds.length > 0) {
      // B) Rompe os agendamentos que usavam esses serviços da categoria
      await db
        .delete(appointmentServicesTable)
        .where(sql`${appointmentServicesTable.serviceId} IN ${serviceIds}`);
      
      // C) Apaga os serviços da categoria
      await db.delete(servicesTable).where(eq(servicesTable.categoriaId, id));
    }

    // D) Agora sim, apaga a categoria mãe limpa
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return true;
  }

  // ✂️ OPERAÇÕES DE SERVIÇO
  async createService(data: { nome: string; duracaoMinutos: number; preco: string; categoriaId: number }) {
    const [newService] = await db.insert(servicesTable).values(data).returning();
    return newService;
  }

  async updateService(id: number, data: { nome: string; duracaoMinutos: number; preco: string; categoriaId: number }) {
    await db
      .update(servicesTable)
      .set({
        nome: data.nome,
        duracaoMinutos: data.duracaoMinutos,
        preco: data.preco,
        categoriaId: data.categoriaId,
      })
      .where(eq(servicesTable.id, id));
      
    return true;
  }

  async deleteService(id: number) {
    // 👑 BLINDAGEM: Limpa o histórico de agendamentos que usavam ESSE serviço específico primeiro
    await db.delete(appointmentServicesTable).where(eq(appointmentServicesTable.serviceId, id));
    
    // ✂️ Agora o serviço está livre para ser deletado
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    return true;
  }
}