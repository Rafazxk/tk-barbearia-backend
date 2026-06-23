import { type RegisterInput } from "../domain/AuthService.js";

export interface IBarberDTO {
  id: number; 
  nome: string;
  email: string;
  password?: string;
  foto?: string | null;
  role: string;
}

export interface IBarbersRepository {
  findByEmail(email: string): Promise<IBarberDTO | null>;
  create(dados: RegisterInput & { passwordHash: string }): Promise<IBarberDTO | null>;
}