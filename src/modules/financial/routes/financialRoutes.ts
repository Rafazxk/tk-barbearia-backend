// backend/src/routes/financial.routes.ts
import { Router } from 'express';
import { getRecebimentosHandler, exportExcelHandler, getSummaryHandler} from '../controllers/FinancialController.js';

const financialRouter = Router();

financialRouter.get('/recebimentos', getRecebimentosHandler);
financialRouter.get('/export', exportExcelHandler);
financialRouter.get('/summary', getSummaryHandler);

export default financialRouter;