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

export function authMiddleware(req: Request, res: Response, next: NextFunction): any {
  console.log("--> MIDDLEWARE FOI CHAMADO!");
  
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (req.originalUrl.includes("/appointments/client/")) {
    return next();
  }
  
  // 🚨 Blindagem extra: impede strings como "undefined", "null" ou espaços vazios
  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    return res.status(401).json({ erro: "Token de autenticação não fornecido" });
  }

  try {
    const secret = process.env.JWT_SECRET || "chave-secreta-super-segura-do-barberflow";
    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}