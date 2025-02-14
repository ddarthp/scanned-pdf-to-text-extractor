import { createWorker, type Worker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import { config } from '../config/config';

export class TesseractService {
  private worker: Worker | null = null;

  private async initWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage(config.ocr.language);
      await this.worker.initialize(config.ocr.language);
      
      // Configuración optimizada para máxima precisión
      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO, // Detección automática de la disposición de la página
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyzáéíóúÁÉÍÓÚüÜ0123456789.,;:-_()[]{}¿?¡!@#$%&*+"\'/ ',
        preserve_interword_spaces: '1'
      });
    }
    return this.worker;
  }

  async processImage(imageBuffer: Buffer): Promise<string> {
    try {
      const worker = await this.initWorker();

      // Preprocesamiento de imagen optimizado para OCR
      const processedBuffer = await sharp(imageBuffer)
        // Convertir a escala de grises para mejor reconocimiento
        .grayscale()
        // Aumentar el contraste para mejorar la detección de texto
        .normalize()
        // Ajustar el brillo
        .modulate({
          brightness: 1.1,
          saturation: 1.0,
          lightness: 1.2
        })
        // Reducir ruido mientras se mantiene el detalle del texto
        .median(1)
        // Ajustar la nitidez para mejorar los bordes del texto
        .sharpen({
          sigma: 1.5,
          m1: 1,
          m2: 2,
          x1: 2,
          y2: 10,
          y3: 20
        })
        // Redimensionar manteniendo la calidad
        .resize(config.pdf.imageWidth, config.pdf.imageHeight, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3 // Mejor algoritmo de redimensionamiento para texto
        })
        // Usar la mejor calidad de JPEG
        .jpeg({ quality: 100, progressive: false })
        .toBuffer();

      // Realizar OCR con la imagen preprocesada
      const { data: { text } } = await worker.recognize(processedBuffer);
      console.log('Extracción de texto exitosa (OCR)');
      return text.trim();
    } catch (error) {
      console.error('Error procesando imagen con OCR:', error);
      return '';
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 