import { Router } from "express";
import multer from "multer";
import { ProductsRepository } from "../repositories/ProductsRepository.js";
import { createClient } from "@supabase/supabase-js";

const productRoutes = Router();
const repository = new ProductsRepository();


const SUPABASE_URL = process.env.SUPABASE_URL || "SUA_URL_DO_SUPABASE";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "SUA_CHAVE_SERVICE_SUPABASE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


const upload = multer({ storage: multer.memoryStorage() });

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

// Criar Produto enviando a imagem para o Supabase Storage
productRoutes.post("/items", upload.single("imagem"), async (req, res, next) => {
  try {
    const { nome, descricao, preco, estoque, categoriaId } = req.body;
    let imagemUrl = null;

    if (req.file) {
      const file = req.file;
      const fileName = `produto-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos") 
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error("Erro no upload para o Supabase Storage:", uploadError);
        return res.status(500).json({ error: "Falha ao enviar a imagem do produto para o storage remoto." });
      }

      const { data: { publicUrl } } = supabase.storage
        .from("produtos")
        .getPublicUrl(fileName);

      imagemUrl = publicUrl;
    }

    const item = await repository.createProduct({
      nome,
      descricao: descricao || null,
      preco: String(preco),
      estoque: Number(estoque),
      categoriaId: Number(categoriaId),
      imagemUrl,
    });

    return res.status(201).json(item);
  } catch (e) { next(e); }
});

// Atualizar Produto enviando a nova imagem (se houver) para o Supabase Storage
productRoutes.put("/items/:id", upload.single("imagem"), async (req, res, next) => {
  try {
    const { nome, descricao, preco, estoque, categoriaId } = req.body;
    
    const productData: Record<string, any> = {};

    if (nome !== undefined) productData.nome = nome;
    if (descricao !== undefined) productData.descricao = descricao || null;
    if (preco !== undefined) productData.preco = String(preco);
    if (estoque !== undefined) productData.estoque = Number(estoque);
    if (categoriaId !== undefined) productData.categoriaId = Number(categoriaId);
    
    if (req.file) {
      const file = req.file;
      const fileName = `produto-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error("Erro no upload para o Supabase Storage:", uploadError);
        return res.status(500).json({ error: "Falha ao atualizar a imagem do produto no storage remoto." });
      }

      const { data: { publicUrl } } = supabase.storage
        .from("produtos")
        .getPublicUrl(fileName);

      productData.imagemUrl = publicUrl;
    }

    await repository.updateProduct(Number(req.params.id), productData as any);
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