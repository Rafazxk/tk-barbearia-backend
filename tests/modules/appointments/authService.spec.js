import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../../../src/modules/auth/domain/AuthService.js";
import { db } from "../../../src/database/index.js"; // Ajuste o caminho se seu db/index estiver na raiz
import bcrypt from "bcrypt";
// Mockamos o banco de dados e o bcrypt globalmente para o arquivo de teste
vi.mock("../../../src/database/index.js", () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn()
                }))
            }))
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn()
            }))
        }))
    }
}));
vi.mock("bcrypt");
describe("AuthService - Testes Unitários", () => {
    let authService;
    beforeEach(() => {
        vi.clearAllMocks();
        authService = new AuthService();
    });
    it("deve retornar null se o e-mail do barbeiro não for encontrado", async () => {
        // GIVEN (Simulamos o encadeamento do Drizzle retornando um array vazio)
        const mockSelectChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([]) // Array vazio = barbeiro não existe
        };
        vi.spyOn(db, "select").mockReturnValue(mockSelectChain);
        // WHEN
        const result = await authService.login("inexistente@barber.com", "senha123");
        // THEN
        expect(result).toBeNull();
    });
    it("deve retornar null se a senha estiver incorreta", async () => {
        // GIVEN (Achou o barbeiro, mas a senha vai falhar)
        const barbeiroFalso = { id: 1, nome: "Kleyton", email: "kleyton@barber.com", password: "hash_criptografado", role: "barber" };
        const mockSelectChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([barbeiroFalso])
        };
        vi.spyOn(db, "select").mockReturnValue(mockSelectChain);
        // Forçamos o bcrypt a dizer que a senha NÃO bate
        vi.spyOn(bcrypt, "compare").mockResolvedValue(false);
        // WHEN
        const result = await authService.login("kleyton@barber.com", "senha_errada");
        // THEN
        expect(result).toBeNull();
    });
});
// CADASTRO 
describe("AuthService - Cadastro de Barbeiros", () => {
    let authService;
    beforeEach(() => {
        authService = new AuthService();
    });
    it("deve lançar um erro se o e-mail já estiver cadastrado", async () => {
        // GIVEN (Simula que o banco achou um barbeiro com o mesmo e-mail)
        const barbeiroExistente = { id: 1, email: "kleyton@barber.com" };
        const mockSelectChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([barbeiroExistente])
        };
        vi.spyOn(db, "select").mockReturnValue(mockSelectChain);
        // WHEN / THEN (Verifica se ele joga o erro esperado na tela)
        const dadosCadastro = { nome: "Kleyton Novo", email: "kleyton@barber.com", password: "password123", role: "barber" };
        await expect(authService.register(dadosCadastro))
            .rejects
            .toThrow("E-mail já cadastrado no sistema");
    });
    it("deve cadastrar um barbeiro com sucesso hasheando a senha", async () => {
        // GIVEN (Nenhum e-mail duplicado encontrado)
        const mockSelectChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([]) // Array vazio = liberado cadastrar
        };
        vi.spyOn(db, "select").mockReturnValue(mockSelectChain);
        // Simula a inserção bem-sucedida do Drizzle retornando o barbeiro criado
        const barbeiroCriado = { id: 5, nome: "Kleyton", email: "kleyton@barber.com", role: "barber" };
        const mockInsertChain = {
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([barbeiroCriado])
        };
        vi.spyOn(db, "insert").mockReturnValue(mockInsertChain);
        vi.spyOn(bcrypt, "hash").mockResolvedValue("senha_hasheada");
        // WHEN
        const dadosCadastro = { nome: "Kleyton", email: "kleyton@barber.com", password: "password123", role: "barber" };
        const result = await authService.register(dadosCadastro);
        // THEN
        expect(result).toHaveProperty("id", 5);
        expect(result.email).toBe("kleyton@barber.com");
        expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10); // Garante que usou o bcrypt!
    });
});
//# sourceMappingURL=authService.spec.js.map