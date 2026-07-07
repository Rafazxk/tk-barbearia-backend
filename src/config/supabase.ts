import multer from 'multer';

// Altere o diskStorage para memoryStorage
export const upload = multer({ 
  storage: multer.memoryStorage() 
});