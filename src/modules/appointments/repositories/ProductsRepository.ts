import { db, produtosTable, produtoCategoriasTable } from "../../../database/index.js";
import { eq, sql } from "drizzle-orm";

export class ProductsRepository {
  // Buscar tudo estruturado por categoria (Enriched)
  async findAllEnriched() {
    const categories = await db
      .select()
      .from(produtoCategoriasTable)
      .orderBy(produtoCategoriasTable.ordem);

    const result = [];

    for (const cat of categories) {
      const items = await db
        .select()
        .from(produtosTable)
        .where(eq(produtosTable.categoriaId, cat.id))
        .orderBy(produtosTable.ordem);

      result.push({
        id: cat.id,
        nome: cat.nome,
        produtos: items.map(p => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: Number(p.preco),
          estoque: p.estoque,
          imagemUrl: p.imagemUrl
        }))
      });
    }

    return result;
  }

  async createCategory(nome: string) {
    const [item] = await db.insert(produtoCategoriasTable).values({ nome }).returning();
    return item;
  }

  async updateCategory(id: number, nome: string) {
    await db.update(produtoCategoriasTable).set({ nome }).where(eq(produtoCategoriasTable.id, id));
  }

  async deleteCategory(id: number) {
    // O Cascade configurado no schema cuidará de apagar os produtos vinculados
    await db.delete(produtoCategoriasTable).where(eq(produtoCategoriasTable.id, id));
  }

  async createProduct(data: { nome: string; descricao?: string; preco: string; estoque: number; categoriaId: number }) {
    const [item] = await db.insert(produtosTable).values(data).returning();
    return item;
  }

  async updateProduct(id: number, data: { nome: string; descricao?: string; preco: string; estoque: number; categoriaId: number }) {
    await db.update(produtosTable).set(data).where(eq(produtosTable.id, id));
  }

  async deleteProduct(id: number) {
    await db.delete(produtosTable).where(eq(produtosTable.id, id));
  }

  async reorderItems(type: "categories" | "products", orderedIds: string[]) {
    if (type === "categories") {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(produtoCategoriasTable).set({ ordem: i }).where(eq(produtoCategoriasTable.id, Number(orderedIds[i])));
      }
    } else if (type === "products") {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(produtosTable).set({ ordem: i }).where(eq(produtosTable.id, Number(orderedIds[i])));
      }
    }
  }
}