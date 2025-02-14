import dotenv from 'dotenv';
import { ProcessingMode, OllamaModel, OpenAIModel } from '../interfaces/types';
import { PSM } from 'tesseract.js';

// Cargar variables de entorno
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3080
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://10.0.0.107:11434',
    model: (process.env.OLLAMA_MODEL || 'llama3.2-vision') as OllamaModel
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: (process.env.OPENAI_MODEL || 'gpt-4o-mini') as OpenAIModel,
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS || 4096)
  },
  ocr: {
    language: process.env.OCR_LANGUAGE || 'spa',
    psmMode: (process.env.OCR_PSM_MODE ? Number(process.env.OCR_PSM_MODE) : PSM.SINGLE_BLOCK) as PSM
  },
  pdf: {
    density: Number(process.env.PDF_DENSITY || 300),
    imageWidth: Number(process.env.PDF_IMAGE_WIDTH || 2048),
    imageHeight: Number(process.env.PDF_IMAGE_HEIGHT || 2048),
    imageQuality: Number(process.env.PDF_IMAGE_QUALITY || 80)
  },
  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE || 500) * 1024 * 1024, // Convertir a bytes
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },
  processing: {
    defaultMode: (process.env.DEFAULT_MODE || 'ollama') as ProcessingMode,
    defaultParallel: process.env.DEFAULT_PARALLEL === 'true'
  }
}; 