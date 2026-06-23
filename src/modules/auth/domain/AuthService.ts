import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { type IBarbersRepository } from "../repositories/IBarbersRepository.js";

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const RegisterBodySchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  foto: z.string().optional(),
  role: z.string().default("barber"),
});

export type RegisterInput = z.infer<typeof RegisterBodySchema>;


//AUTENTICAÇÃO 



export class AuthService {
  private jwtSecret: string;
  // Agora tipado estritamente com a INTERFACE, ocultando a tecnologia do banco
  private barbersRepository: IBarbersRepository;

  // Recebe quem implementa a interface via construtor
  constructor(barbersRepository: IBarbersRepository) {
    this.jwtSecret = process.env.JWT_SECRET || "chave-secreta-super-segura-do-barberflow";
    this.barbersRepository = barbersRepository;
  }

  async login(email: string, senhaInformada: string) {
    const barbeiro = await this.barbersRepository.findByEmail(email);

    if (!barbeiro || !barbeiro.password) {
      return null;
    }

    const senhaValida = await bcrypt.compare(senhaInformada, barbeiro.password);
    if (!senhaValida) {
      return null;
    }

    const token = jwt.sign(
      { id: barbeiro.id, role: barbeiro.role },
      this.jwtSecret,
      { expiresIn: "1d" }
    );

    return {
      barbeiro: {
        id: barbeiro.id,
        nome: barbeiro.nome,
        email: barbeiro.email,
        role: barbeiro.role
      },
      token
    };
  }

  async register(dados: RegisterInput) {
    const barbeiroExistente = await this.barbersRepository.findByEmail(dados.email);

    if (barbeiroExistente) {
      throw new Error("E-mail já cadastrado no sistema");
    }

    const hashedPassword = await bcrypt.hash(dados.password, 10);

    const novoBarbeiro = await this.barbersRepository.create({
      ...dados,
      passwordHash: hashedPassword
    });

    if (!novoBarbeiro) {
      throw new Error("Erro ao criar o registro do barbeiro no banco de dados");
    }

    return {
      id: novoBarbeiro.id,
      nome: novoBarbeiro.nome,
      email: novoBarbeiro.email,
      role: novoBarbeiro.role,
    };
  }

  // LOGIN COM GOOGLE 
  
  async loginWithGoogle(googleToken: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    // 1. Defesa preventiva: se a variável não existir, para o fluxo aqui
    if (!googleClientId) {
      throw new Error("Configuração do Google Client ID não encontrada no servidor.");
    }

    // Instancia o cliente garantindo que a string existe
    const client = new OAuth2Client(googleClientId);

    // 2. Agora o TS sabe que 'audience' é 100% string, limpando o erro
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Autenticação inválida com o Google");
    }

    // 3. Busca o barbeiro por e-mail no repositório usando a nossa interface
    const barbeiro = await this.barbersRepository.findByEmail(payload.email);

    // Regra dos 3 barbeiros: se não estiver pré-cadastrado, barra!
    if (!barbeiro) {
      throw new Error("Usuário não autorizado a acessar este painel");
    }

    // 4. Gera o token JWT interno do TK Barbearia
    const token = jwt.sign(
      { id: barbeiro.id, role: barbeiro.role },
      this.jwtSecret,
      { expiresIn: "1d" }
    );

    return {
      barbeiro: {
        id: barbeiro.id,
        nome: barbeiro.nome,
        email: barbeiro.email,
        role: barbeiro.role
      },
      token
    };
  }

}