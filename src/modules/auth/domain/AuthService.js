import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../../database/index.js";
import { barbersTable } from "../../../database/schema.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
export const RegisterBodySchema = z.object({
    nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    foto: z.string().optional(),
    role: z.string().default("barber"),
});
export class AuthService {
    jwtSecret;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || "chave-secreta-super-segura-do-barberflow";
    }
    async login(email, senhaInformada) {
        const [barbeiro] = await db
            .select()
            .from(barbersTable)
            .where(eq(barbersTable.email, email))
            .limit(1);
        if (!barbeiro) {
            return null;
        }
        const senhaValida = await bcrypt.compare(senhaInformada, barbeiro.password);
        if (!senhaValida) {
            return null;
        }
        const token = jwt.sign({ id: barbeiro.id, role: barbeiro.role }, this.jwtSecret, { expiresIn: "1d" });
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
    async register(dados) {
        // 1. Verifica se já existe um barbeiro com o mesmo e-mail
        const [barbeiroExistente] = await db
            .select()
            .from(barbersTable)
            .where(eq(barbersTable.email, dados.email))
            .limit(1);
        if (barbeiroExistente) {
            throw new Error("E-mail já cadastrado no sistema");
        }
        // 2. Criptografa a senha com o bcrypt (10 rounds de sal)
        const hashedPassword = await bcrypt.hash(dados.password, 10);
        // 3. Salva o novo barbeiro no banco de dados usando o Drizzle
        const [novoBarbeiro] = await db
            .insert(barbersTable)
            .values({
            nome: dados.nome,
            email: dados.email,
            password: hashedPassword,
            foto: dados.foto,
            role: dados.role,
        })
            .returning();
        if (!novoBarbeiro)
            throw new Error("Erro ao criar o registro do barbeiro no banco de dados");
        // 4. Retorna os dados limpos (sem a senha por segurança)
        return {
            id: novoBarbeiro.id,
            nome: novoBarbeiro.nome,
            email: novoBarbeiro.email,
            role: novoBarbeiro.role,
        };
    }
}
//# sourceMappingURL=AuthService.js.map