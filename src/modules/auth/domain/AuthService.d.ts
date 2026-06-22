import { z } from "zod";
export declare const RegisterBodySchema: z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    foto: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof RegisterBodySchema>;
export declare class AuthService {
    private jwtSecret;
    constructor();
    login(email: string, senhaInformada: string): Promise<{
        barbeiro: {
            id: number;
            nome: string;
            email: string;
            role: string | null;
        };
        token: string;
    } | null>;
    register(dados: RegisterInput): Promise<{
        id: number;
        nome: string;
        email: string;
        role: string | null;
    }>;
}
//# sourceMappingURL=AuthService.d.ts.map