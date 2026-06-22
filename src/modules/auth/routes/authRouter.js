import { Router } from "express";
import { AuthController } from "../controller/authController.js";
const authRouter = Router();
const authController = new AuthController();
// Rotas públicas de autenticação
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
export { authRouter };
//# sourceMappingURL=authRouter.js.map