import { Router } from "express";
import { CategoriesRepository } from "../repositories/CategoriesRepository.js";

const categoryRoutes = Router();
const repository = new CategoriesRepository();

// 🔄 Reordenar Categorias ou Serviços via Drag and Drop
categoryRoutes.post("/reorder", async (req, res, next) => {
  try {
    const { type, orderedIds } = req.body;

    if (!type || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "Parâmetros inválidos para reordenação." });
    }

    // Delega a atualização sequencial para o repositório
    await repository.reorderItems(type, orderedIds);

    return res.sendStatus(200);
  } catch (e) {
    next(e);
  }
});

// Buscar lista completa enriquecida
categoryRoutes.get("/enriched", async (req, res, next) => {
  try {
    const data = await repository.findAllEnriched();
    return res.json(data);
  } catch (e) { next(e); }
});

// Criar Categoria
categoryRoutes.post("/", async (req, res, next) => {
  try {
    const { nome } = req.body;
    const item = await repository.createCategory(nome);
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

// Deletar Categoria
categoryRoutes.delete("/:id", async (req, res, next) => {
  try {
    await repository.deleteCategory(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

categoryRoutes.put("/services/:id", async (req, res, next) => {
  try {
    const { nome, duracao, preco, categoriaId } = req.body;
    
    await repository.updateService(Number(req.params.id), {
      nome,
      duracaoMinutos: Number(duracao),
      preco: String(preco),
      categoriaId: Number(categoriaId)
    });

    return res.sendStatus(200);
  } catch (e) { 
    next(e); 
  }
});

// Criar Serviço
categoryRoutes.post("/services", async (req, res, next) => {
  try {
    const { nome, duracao, preco, categoriaId } = req.body;
    const item = await repository.createService({
      nome,
      duracaoMinutos: Number(duracao),
      preco: String(preco),
      categoriaId: Number(categoriaId)
    });
    return res.status(201).json(item);
  } catch (e) { next(e); }
});

// Deletar Serviço
categoryRoutes.delete("/services/:id", async (req, res, next) => {
  try {
    await repository.deleteService(Number(req.params.id));
    return res.sendStatus(204);
  } catch (e) { next(e); }
});

export { categoryRoutes };