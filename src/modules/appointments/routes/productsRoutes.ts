import { Router } from "express";
import { ProductsRepository } from "../repositories/ProductsRepository.js";

const productRoutes = Router();
const repository = new ProductsRepository();

productRoutes.get("/", async (req, res, next) => {
  try {
    const data = await repository.findAllEnriched();
    return res.json(data);
  } catch (e) { next(e); }
});

productRoutes.post("/reorder", async (req, res, next) => {
  try {
    const { type, orderedIds } = req.body;
    await repository.reorderItems(type, orderedIds);
    return res.sendStatus(200);
  } catch (e) { next(e); }
});

productRoutes.post("/", async (req, res, next) => {
  try {
    const item = await repository.createCategory(req.body.nome);
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

productRoutes.put("/:id", async (req, res, next) => {
  try {
    await repository.updateCategory(Number(req.params.id), req.body.nome);
    return res.sendStatus(200);
  } catch (e) { next(e); }
});

productRoutes.delete("/:id", async (req, res, next) => {
  try {
    await repository.deleteCategory(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

productRoutes.post("/items", async (req, res, next) => {
  try {
    const { nome, descricao, preco, estoque, categoriaId } = req.body;
    const item = await repository.createProduct({
      nome,
      descricao,
      preco: String(preco),
      estoque: Number(estoque),
      categoriaId: Number(categoriaId)
    });
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

productRoutes.put("/items/:id", async (req, res, next) => {
  try {
    const { nome, descricao, preco, estoque, categoriaId } = req.body;
    await repository.updateProduct(Number(req.params.id), {
      nome,
      descricao,
      preco: String(preco),
      estoque: Number(estoque),
      categoriaId: Number(categoriaId)
    });
    return res.sendStatus(200);
  } catch (e) { next(e); }
});

productRoutes.delete("/items/:id", async (req, res, next) => {
  try {
    await repository.deleteProduct(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

export { productRoutes };