import { type Request, type Response } from "express";
import { AuthService, RegisterBodySchema } from "../domain/AuthService.js";
import { z } from "zod";

const UpdateProfileBodySchema = z.object({
  nome: z.string().min(2, "O nome deve ter no mínimo 2 caracteres.")
});

const UpdateNotificationPreferenceSchema = z.object({
  ativo: z.boolean(),
});

const LoginBodySchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "O token do google é obrigatório.")
});

const GoogleLoginBodySchema = z.object({
  token: z.string().min(1, "O token do Google é obrigatório"),
});

export class AuthController {
  

  constructor(private authService: AuthService) {}


  private setAuthCookie(res: Response, token: string) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, 
      sameSite: "none", 
      maxAge: 24 * 60 * 60 * 1000 
    });
  }


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


  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = LoginBodySchema.parse(req.body);
      const resultado = await this.authService.login(email, password);
      
      if (!resultado) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      // Aplica a blindagem do cookie cross-domain
      this.setAuthCookie(res, resultado.token);

      return res.json({ barbeiro: resultado.barbeiro, token: resultado.token });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ erros: error.format() });
      }
      console.error("❌ ERRO NO LOGIN:", error);
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  };


  loginWithGoogle = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = GoogleLoginBodySchema.parse(req.body);
      const resultado = await this.authService.loginWithGoogle(token);

      //  BLINDAGEM: O Google agora também injeta o cookie HttpOnly padronizado!
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

  updateProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const barberId = (req as any).user?.id;
    if (!barberId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { nome } = UpdateProfileBodySchema.parse(req.body);
    const perfilAtualizado = await this.authService.updateProfile(Number(barberId), nome);

    return res.json(perfilAtualizado);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ erros: error.format() });
    }
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: error.message || "Erro interno ao atualizar perfil." });
  }
};

updateNotificationPreference = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const barberId = (req as any).user?.id;

    if (!barberId) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    const { ativo } = UpdateNotificationPreferenceSchema.parse(req.body);

    const atualizado =
      await this.authService.updateNotificacoesNovoAgendamento(
        Number(barberId),
        ativo
      );

    return res.json({
      message: "Preferência de notificação atualizada.",
      notificacoesNovoAgendamento:
        atualizado.notificacoesNovoAgendamento,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        erros: error.format(),
      });
    }

    console.error(
      "Erro ao atualizar preferência de notificações:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Erro interno ao atualizar preferência.",
    });
  }
};

getNotificationPreference = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const barberId = (req as any).user?.id;

    if (!barberId) {
      return res.status(401).json({
        error: "Usuário não autenticado."
      });
    }

    const ativo =
      await this.authService.getNotificacoesNovoAgendamento(
        Number(barberId)
      );

    return res.json({
      ativo
    });
  } catch (error: any) {
    console.error(
      "Erro ao buscar preferência de notificação:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Erro ao buscar preferência de notificação."
    });
  }
};
}