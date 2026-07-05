import { relations } from "drizzle-orm";

import {
  produtosTable,
  produtoCategoriasTable,
} from "../schema/product.schema.js";

export const produtosRelations = relations(
  produtosTable,
  ({ one }) => ({
    category: one(produtoCategoriasTable, {
      fields: [produtosTable.categoriaId],
      references: [produtoCategoriasTable.id],
    }),
  })
);

export const produtoCategoriasRelations = relations(
  produtoCategoriasTable,
  ({ many }) => ({
    products: many(produtosTable),
  })
);