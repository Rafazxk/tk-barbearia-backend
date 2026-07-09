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
  
  // 1. Logs de Debug para o Render (para você ver exatamente o que chega)
  console.log("Headers recebidos:", req.headers.authorization);
  console.log("Cookies recebidos:", req.cookies);

  // 2. Extração segura
  let token = req.headers.authorization?.startsWith("Bearer ") 
    ? req.headers.authorization.split(" ")[1] 
    : req.cookies?.token;

  if (req.originalUrl.includes("/appointments/client/")) {
    return next();
  }
  
  if (!token || token === "undefined" || token === "null") {
    console.error("ERRO: Token ausente ou inválido no iPhone/Celular.");
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