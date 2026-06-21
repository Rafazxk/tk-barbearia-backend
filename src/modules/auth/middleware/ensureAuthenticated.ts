import {type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: number;
  role: string;
}

// Estendendo temporariamente a tipagem do Express para aceitar o objeto user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): any {
  // 1. Tenta pegar o token do Cookie ou do cabeçalho Authorization
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido" });
  }

  try {
    // 2. Valida se o token é legítimo
    const secret = process.env.JWT_SECRET || "chave-secreta-super-segura-do-barberflow";
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // 3. Injeta os dados do barbeiro logado dentro da requisição!
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    return next(); // Libera a passagem para a rota real!
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}