import { type RegisterInput } from "../domain/AuthService.js";

export interface IBarberDTO {
  id: number; 
  nome: string;
  email: string;
  password?: string;
  telefone: string| null;
  foto?: string | null;
  role: string;
}

export interface IBarbersRepository {
  findByEmail(email: string): Promise<IBarberDTO | null>;
  create(dados: RegisterInput & { passwordHash: string }): Promise<IBarberDTO | null>;
  listBarbers(): Promise<IBarberDTO[]>;
  findById(id: number): Promise<IBarberDTO | null>;
  updateFoto(id: number, fotoUrl: string): Promise<IBarberDTO>;
}