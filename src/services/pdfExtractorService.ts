import { promises as fs } from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { fromPath } from 'pdf2pic';
import { PDFExtractResult, PDFPageContent, ProcessingMode, OllamaModel, OpenAIModel, PageRange } from '../interfaces/types';
import { OllamaService } from './ollamaService';
import { TesseractService } from './tesseractService';
import { OpenAIService } from './openaiService';
import { config } from '../config/config';

// Configurar el worker de pdf.js
const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PDFExtractorService {
  private ollamaService: OllamaService;
  private tesseractService: TesseractService;
  private openaiService: OpenAIService;

  constructor() {
    this.ollamaService = new OllamaService();
    this.tesseractService = new TesseractService();
    this.openaiService = new OpenAIService();
  }

  private parsePageRange(pageRange: string | undefined, totalPages: number): PageRange {
    if (!pageRange) {
      return { start: 1, end: totalPages };
    }

    const [start, end] = pageRange.split('-').map(Number);
    return {
      start: Math.max(1, Math.min(start || 1, totalPages)),
      end: Math.min(end || totalPages, totalPages)
    };
  }

  private parseSelectedPages(selectedPages: string | undefined, totalPages: number): number[] {
    if (!selectedPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    return selectedPages
      .split(',')
      .map(page => parseInt(page.trim()))
      .filter(page => !isNaN(page))
      .sort((a, b) => a - b);
  }

  async processImage(imageBuffer: Buffer, mode: ProcessingMode = 'ollama', model?: OllamaModel | OpenAIModel): Promise<string> {
    switch (mode) {
      case 'ollama':
        if (model && !['llama3.2-vision', 'llava'].includes(model as string)) {
          throw new Error(`Modelo ${model} no válido para el modo Ollama`);
        }
        return this.ollamaService.processImage(imageBuffer, (model as OllamaModel) || config.ollama.model);
      case 'openai':
        if (model && !['gpt-4o-mini', 'gpt-4o'].includes(model as string)) {
          throw new Error(`Modelo ${model} no válido para el modo OpenAI`);
        }
        return this.openaiService.processImage(imageBuffer, (model as OpenAIModel) || config.openai.model);
      case 'ocr':
        return this.tesseractService.processImage(imageBuffer);
      default:
        throw new Error(`Modo de procesamiento no soportado: ${mode}`);
    }
  }

  private getDefaultModel(mode: ProcessingMode): OllamaModel | OpenAIModel | undefined {
    switch (mode) {
      case 'ollama':
        return config.ollama.model;
      case 'openai':
        return config.openai.model;
      default:
        return undefined;
    }
  }

  private async convertPDFToImagesForOCR(pdfPath: string, numPages: number, pageRange?: string, selectedPages?: string): Promise<string[]> {
    try {
      const options = {
        density: config.pdf.density,
        saveFilename: "page",
        savePath: path.dirname(pdfPath),
        format: "jpg" as const,
        width: config.pdf.imageWidth,
        height: config.pdf.imageHeight
      };
      
      const convert = fromPath(pdfPath, options);
      const imageFiles: string[] = [];

      let pagesToProcess: number[];
      if (selectedPages) {
        pagesToProcess = this.parseSelectedPages(selectedPages, numPages);
      } else {
        const range = this.parsePageRange(pageRange, numPages);
        pagesToProcess = Array.from(
          { length: range.end - range.start + 1 },
          (_, i) => range.start + i
        );
      }

      console.log('Convirtiendo PDF a imágenes (modo OCR)...');
      for (const pageNum of pagesToProcess) {
        if (pageNum > numPages) {
          console.warn(`Página ${pageNum} está fuera del rango del documento (1-${numPages})`);
          imageFiles.push(''); // Marcador para página fuera de rango
          continue;
        }

        console.log(`Convirtiendo página ${pageNum} de ${numPages}`);
        const result = await convert(pageNum);
        if (result.path) {
          imageFiles.push(result.path);
        } else {
          console.error(`No se pudo obtener la ruta de la imagen para la página ${pageNum}`);
          imageFiles.push(''); // Marcador para página con error
        }
      }
      
      return imageFiles;
    } catch (error) {
      console.error('Error convirtiendo PDF a imágenes:', error);
      return [];
    }
  }

  private async convertPDFToImagesForLLM(pdfPath: string, numPages: number, pageRange?: string, selectedPages?: string): Promise<string[]> {
    try {
      const options = {
        density: 150,
        saveFilename: "page",
        savePath: path.dirname(pdfPath),
        format: "jpg" as const,
        width: 1024,
        height: 1024
      };
      
      const convert = fromPath(pdfPath, options);
      const imageFiles: string[] = [];

      let pagesToProcess: number[];
      if (selectedPages) {
        pagesToProcess = this.parseSelectedPages(selectedPages, numPages);
      } else {
        const range = this.parsePageRange(pageRange, numPages);
        pagesToProcess = Array.from(
          { length: range.end - range.start + 1 },
          (_, i) => range.start + i
        );
      }

      console.log('Convirtiendo PDF a imágenes (modo LLM)...');
      for (const pageNum of pagesToProcess) {
        if (pageNum > numPages) {
          console.warn(`Página ${pageNum} está fuera del rango del documento (1-${numPages})`);
          imageFiles.push(''); // Marcador para página fuera de rango
          continue;
        }

        console.log(`Convirtiendo página ${pageNum} de ${numPages}`);
        const result = await convert(pageNum);
        if (result.path) {
          imageFiles.push(result.path);
        } else {
          console.error(`No se pudo obtener la ruta de la imagen para la página ${pageNum}`);
          imageFiles.push(''); // Marcador para página con error
        }
      }
      
      return imageFiles;
    } catch (error) {
      console.error('Error convirtiendo PDF a imágenes:', error);
      return [];
    }
  }

  private async processImagesInSeries(imageFiles: string[], numPages: number, mode: ProcessingMode, model?: OllamaModel | OpenAIModel): Promise<Array<{
    page: number;
    text: string;
    error: string | null;
  }>> {
    const results = [];
    const defaultModel = this.getDefaultModel(mode);
    
    for (const [index, imagePath] of imageFiles.entries()) {
      const pageNum = index + 1;
      console.log(`Procesando página ${pageNum} de ${numPages} (modo serie, ${mode}${mode !== 'ocr' ? `, modelo ${model || defaultModel}` : ''})`);
      
      try {
        const imageBuffer = await fs.readFile(imagePath);
        const pageText = await this.processImage(imageBuffer, mode, model);
        
        await fs.unlink(imagePath);
        
        results.push({
          page: pageNum,
          text: pageText,
          error: null
        });
      } catch (pageError) {
        console.error(`Error en página ${pageNum}:`, pageError);
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.error(`Error eliminando imagen temporal de página ${pageNum}:`, unlinkError);
        }
        
        results.push({
          page: pageNum,
          text: '',
          error: `Error procesando página: ${(pageError as Error).message}`
        });
      }
    }
    
    return results;
  }

  private async processImagesInParallel(imageFiles: string[], numPages: number, mode: ProcessingMode, model?: OllamaModel | OpenAIModel): Promise<Array<{
    page: number;
    text: string;
    error: string | null;
  }>> {
    const defaultModel = this.getDefaultModel(mode);
    const processPromises = imageFiles.map(async (imagePath, index) => {
      const pageNum = index + 1;
      console.log(`Procesando página ${pageNum} de ${numPages} (modo paralelo, ${mode}${mode !== 'ocr' ? `, modelo ${model || defaultModel}` : ''})`);
      
      try {
        const imageBuffer = await fs.readFile(imagePath);
        const pageText = await this.processImage(imageBuffer, mode, model);
        
        await fs.unlink(imagePath);
        
        return {
          page: pageNum,
          text: pageText,
          error: null
        };
      } catch (pageError) {
        console.error(`Error en página ${pageNum}:`, pageError);
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.error(`Error eliminando imagen temporal de página ${pageNum}:`, unlinkError);
        }
        
        return {
          page: pageNum,
          text: '',
          error: `Error procesando página: ${(pageError as Error).message}`
        };
      }
    });
    
    return Promise.all(processPromises);
  }

  async extractTextFromPDF(
    pdfPath: string,
    parallel: boolean = false,
    mode: ProcessingMode = 'ollama',
    model?: OllamaModel | OpenAIModel,
    pageRange?: string,
    selectedPages?: string
  ): Promise<PDFExtractResult> {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = new Uint8Array(dataBuffer);
      const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
      const numPages = pdfDoc.numPages;
      
      let pagesToProcess: number[];
      if (selectedPages) {
        pagesToProcess = this.parseSelectedPages(selectedPages, numPages);
      } else {
        const range = this.parsePageRange(pageRange, numPages);
        pagesToProcess = Array.from(
          { length: range.end - range.start + 1 },
          (_, i) => range.start + i
        );
      }

      let fullText = '';
      let hasText = false;
      
      const pagePromises = pagesToProcess.map(async pageNum => {
        if (pageNum > numPages) {
          return { 
            pageNum, 
            text: '', 
            error: `Página ${pageNum} está fuera del rango del documento (1-${numPages})`
          };
        }

        const page = await pdfDoc.getPage(pageNum);
        const content = await page.getTextContent() as PDFPageContent;
        const pageText = content.items.map(item => item.str).join(' ');
        return { pageNum, text: pageText, error: null };
      });

      const pageResults = await Promise.all(pagePromises);
      
      pageResults.forEach(({ text }) => {
        fullText += text + '\n';
        if (text.trim().length > 50) {
          hasText = true;
        }
      });
      
      if (hasText) {
        return {
          success: true,
          text: fullText,
          isScanned: false,
          pages: pageResults.map(({ pageNum, text, error }) => ({
            page: pageNum,
            text,
            error
          })),
          totalPages: numPages
        };
      }
      
      console.log(`PDF escaneado detectado, procesando con ${mode.toUpperCase()} en modo ${parallel ? 'paralelo' : 'serie'}...`);
      
      const imageFiles = mode === 'ocr' 
        ? await this.convertPDFToImagesForOCR(pdfPath, numPages, pageRange, selectedPages)
        : await this.convertPDFToImagesForLLM(pdfPath, numPages, pageRange, selectedPages);
      
      const results = parallel 
        ? await this.processImagesInParallel(imageFiles, numPages, mode, model)
        : await this.processImagesInSeries(imageFiles, numPages, mode, model);
      
      return {
        success: true,
        pages: results,
        totalPages: numPages,
        isScanned: true
      };
      
    } catch (error) {
      console.error('Error procesando PDF:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
} 