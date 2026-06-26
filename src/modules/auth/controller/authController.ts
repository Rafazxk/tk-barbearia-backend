import { type Request, type Response } from "express";
import { AuthService, RegisterBodySchema } from "../domain/AuthService.js";
import { BarbersRepository}  from "../repositories/BarbersRepository.js"
import { z } from "zod";

const LoginBodySchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "O token do google é obrigatório.")
});

const GoogleLoginBodySchema = z.object({
  token: z.string().min(1, "O token do Google é obrigatório"),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    const barbersRepository = new BarbersRepository();
    this.authService = new AuthService(barbersRepository);
  }

  // POST /auth/register
  register = async (req: Request, res: Response): Promise<any> => {
    try {

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

      // 🔍 PRINTA NO TERMINAL DA RAILWAY
      console.error("❌ ERRO REAL NO LOGIN CAPTURADO:", error);

      // 🛡️ ENVIA O ERRO REAL PARA A ABA NETWORK DO NAVEGADOR
      return res.status(500).json({ 
        erro: "Erro interno no servidor",
        mensagemReal: error.message || String(error),
        stack: error.stack
      });}
  };

  loginWithGoogle = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = GoogleLoginBodySchema.parse(req.body);

      const resultado = await this.authService.loginWithGoogle(token);

      return res.status(200).json(resultado);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Erro de validação", detalhes: error });
      }
      // Se o e-mail do Google não for de um dos 3 barbeiros, vai cair no 401 (Não autorizado)
      if (error.message === "Usuário não autorizado a acessar este painel") {
        return res.status(401).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message || "Falha na autenticação com o Google." });
    }
  }
}