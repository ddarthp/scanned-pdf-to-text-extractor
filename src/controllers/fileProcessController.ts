import { Response } from 'express';
import { promises as fs } from 'fs';
import { MulterRequest, ProcessFileResult, ProcessingMode, OllamaModel, OpenAIModel } from '../interfaces/types';
import { PDFExtractorService } from '../services/pdfExtractorService';
import { config } from '../config/config';

export class FileProcessController {
  private pdfExtractor: PDFExtractorService;

  constructor() {
    this.pdfExtractor = new PDFExtractorService();
  }

  private getDefaultModel(mode: ProcessingMode): OllamaModel | OpenAIModel {
    switch (mode) {
      case 'ollama':
        return config.ollama.model;
      case 'openai':
        return config.openai.model;
      default:
        return config.ollama.model; // Fallback por defecto
    }
  }

  async processFile(req: MulterRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
        return;
      }

      const filePath = req.file.path;
      let result: ProcessFileResult;

      try {
        // Obtener parámetros del request o usar valores por defecto
        const parallel = req.query.parallel === 'true';
        const mode = (req.query.mode || config.processing.defaultMode) as ProcessingMode;
        const model = req.query.model || this.getDefaultModel(mode);
        const pageRange = req.query.page_range;
        const selectedPages = req.query.selected_pages;

        if (req.file.mimetype === 'application/pdf') {
          console.log(`Procesando PDF en modo ${parallel ? 'paralelo' : 'serie'} usando ${mode.toUpperCase()}${mode !== 'ocr' ? ` con modelo ${model}` : ''}`);
          if (pageRange) console.log(`Rango de páginas: ${pageRange}`);
          if (selectedPages) console.log(`Páginas seleccionadas: ${selectedPages}`);
          
          const pdfResult = await this.pdfExtractor.extractTextFromPDF(
            filePath, 
            parallel, 
            mode, 
            model, 
            pageRange, 
            selectedPages
          );
          result = pdfResult;
        } else if (req.file.mimetype.startsWith('image/')) {
          const imageBuffer = await fs.readFile(filePath);
          const text = await this.pdfExtractor.processImage(imageBuffer, mode, model);
          result = {
            success: true,
            text,
            isImage: true
          };
        } else {
          result = {
            success: false,
            error: 'Formato de archivo no soportado'
          };
        }

        // Limpiar el archivo temporal
        await fs.unlink(filePath);

        if (!result.success) {
          res.status(400).json(result);
          return;
        }

        res.json(result);
      } catch (error) {
        // Intentar limpiar el archivo temporal incluso si hubo un error
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error('Error eliminando archivo temporal:', unlinkError);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error en el controlador:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al procesar el documento' 
      });
    }
  }
} 