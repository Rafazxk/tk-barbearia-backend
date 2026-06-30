import { type Request, type Response } from "express";
import { AuthService, RegisterBodySchema } from "../domain/AuthService.js";
import { z } from "zod";

const LoginBodySchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "O token do google é obrigatório.")
});

const GoogleLoginBodySchema = z.object({
  token: z.string().min(1, "O token do Google é obrigatório"),
});

export class AuthController {
  
  // Tira do Controller a responsabilidade de saber criar instâncias de banco de dados
  constructor(private authService: AuthService) {}

  // Helper privado para centralizar a criação do cookie seguro
  private setAuthCookie(res: Response, token: string) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, 
      sameSite: "none", 
      maxAge: 24 * 60 * 60 * 1000 
    });
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

  // GET /auth/barbers
  // 👇 CORRIGIDO: Agora usa Arrow Function para blindar o 'this' e busca através do Service
  listBarbers = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Delegando a responsabilidade de buscar os dados para o AuthService
      const barbers = await this.authService.listAllBarbers();

      return res.json(barbers);
    } catch (error: any) {
      console.error("Erro ao listar barbeiros:", error);
      return res.status(500).json({ error: error.message || "Erro interno ao buscar profissionais." });
    }
  };

  // POST /auth/login
  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = LoginBodySchema.parse(req.body);
      const resultado = await this.authService.login(email, password);
      
      if (!resultado) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      // Aplica a blindagem do cookie cross-domain
      this.setAuthCookie(res, resultado.token);

      return res.json({ barbeiro: resultado.barbeiro });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ erros: error.format() });
      }
      console.error("❌ ERRO NO LOGIN:", error);
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  };

  // POST /auth/login-google
  loginWithGoogle = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = GoogleLoginBodySchema.parse(req.body);
      const resultado = await this.authService.loginWithGoogle(token);

      // 👑 BLINDAGEM: O Google agora também injeta o cookie HttpOnly padronizado!
      this.setAuthCookie(res, resultado.token);

      return res.status(200).json({ barbeiro: resultado.barbeiro });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Erro de validação", detalhes: error.format() });
      }
      if (error.message === "Usuário não autorizado a acessar este painel") {
        return res.status(401).json({ error: error.message });
      }
      console.error("❌ ERRO GOOGLE AUTH:", error);
      return res.status(400).json({ error: error.message || "Falha na autenticação com o Google." });
    }
  };
}