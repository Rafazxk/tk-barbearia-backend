import { type Request, type Response, type NextFunction } from "express";
interface TokenPayload {
    id: number;
    role: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
export declare function ensureAuthenticated(req: Request, res: Response, next: NextFunction): any;
export {};
//# sourceMappingURL=ensureAuthenticated.d.ts.map