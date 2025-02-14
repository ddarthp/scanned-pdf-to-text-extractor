import { Request } from 'express';

export interface PDFExtractResult {
  success: boolean;
  text?: string;
  error?: string;
  isScanned?: boolean;
  pages?: PDFPageResult[];
  totalPages?: number;
}

export interface PDFPageContent {
  items: Array<{
    str: string;
  }>;
}

export interface ProcessFileResult {
  success: boolean;
  text?: string;
  isImage?: boolean;
  error?: string;
}

export type ProcessingMode = 'ollama' | 'ocr' | 'openai';

export type OllamaModel = 'llama3.2-vision' | 'llava';

export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o';

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  query: {
    parallel?: string;
    mode?: ProcessingMode;
    model?: OllamaModel | OpenAIModel;
    page_range?: string;
    selected_pages?: string;
  };
}

export interface PageRange {
  start: number;
  end: number;
}

export interface PDFPageResult {
  page: number;
  text: string;
  error?: string | null;
}

export interface IFileProcessor {
  processFile(filePath: string): Promise<ProcessFileResult>;
} 