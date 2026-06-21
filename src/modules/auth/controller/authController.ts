import { type Request, type Response } from "express";
import { AuthService, RegisterBodySchema } from "../domain/AuthService.js";
import { z } from "zod";

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<any> => {
    try {
      // Valida a entrada com o Zod Schema que criamos no Service
      const dadosValidados = RegisterBodySchema.parse(req.body);
      
      const novoBarbeiro = await this.authService.register(dadosValidados);
      return res.status(201).json(novoBarbeiro);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ erros: error.format() });
      }
      return res.status(400).json({ erro: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, password } = LoginBodySchema.parse(req.body);
      
      const resultado = await this.authService.login(email, password);
      
      if (!resultado) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      // 💡 Padrão de Segurança: Enviamos o token em um Cookie HttpOnly
      // Isso impede que scripts maliciosos acessem o token no Front-end
      res.cookie("token", resultado.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true em produção
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
      });

      return res.json({ barbeiro: resultado.barbeiro });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ erros: error.format() });
      }
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  };
}