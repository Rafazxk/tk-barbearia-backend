import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthService } from "../domain/AuthService.js";
import { BarbersRepository } from "../repositories/BarbersRepository.js";

const authRouter = Router();

const barbersRepository = new BarbersRepository();
const authService = new AuthService(barbersRepository);
const authController = new AuthController(authService);

// Rotas públicas de autenticação
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/google", authController.loginWithGoogle);

authRouter.get("/barbers", authController.listBarbers);

export { authRouter };