import { Router } from 'express';
import multer from 'multer';
import { FileProcessController } from '../controllers/fileProcessController';

const router = Router();
const fileController = new FileProcessController();

// Configuración de multer para manejar la subida de archivos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024 // límite de 500MB
  }
});

// Ruta para procesar archivos
router.post('/process', 
  upload.single('document'), 
  (req, res) => fileController.processFile(req, res)
);

export default router; 