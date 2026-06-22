import { type Request, type Response } from "express";
export declare class AuthController {
    private authService;
    constructor();
    register: (req: Request, res: Response) => Promise<any>;
    login: (req: Request, res: Response) => Promise<any>;
}
//# sourceMappingURL=authController.d.ts.map