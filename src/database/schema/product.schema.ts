import { pgTable, serial, varchar, integer, decimal } from "drizzle-orm/pg-core";

export const produtoCategoriasTable = pgTable("produto_categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ordem: integer("ordem").default(0),
});

export const produtosTable = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  estoque: integer("estoque").default(0),
  imagemUrl: varchar("imagem_url", { length: 1000 }), // 📸 Já preparado para amanhã!
  categoriaId: integer("categoria_id")
    .references(() => produtoCategoriasTable.id, { onDelete: "cascade" })
    .notNull(),
  ordem: integer("ordem").default(0),
});
