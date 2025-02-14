import OpenAI from 'openai';
import sharp from 'sharp';
import { config } from '../config/config';
import { OpenAIModel } from '../interfaces/types';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key no configurada');
    }
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async processImage(imageBuffer: Buffer, model: OpenAIModel = config.openai.model): Promise<string> {
    try {
      const processedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: config.pdf.imageQuality })
        .resize(config.pdf.imageWidth, config.pdf.imageHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toBuffer();
      
      const base64Image = Buffer.from(processedBuffer).toString('base64');
      
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en extracción de texto de imágenes. Tu tarea es transcribir EXACTAMENTE el texto que ves en la imagen, manteniendo el formato original.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza esta imagen y extrae ÚNICAMENTE el texto del contenido principal del documento. IMPORTANTE:\n' +
               '- Realiza una transcripción EXACTA del texto, manteniendo la ortografía original\n' +
               '- NO corrijas errores ortográficos ni gramaticales\n' +
               '- NUNCA alteres mayúsculas o minúsculas - transcribe EXACTAMENTE como aparece cada letra\n' +
               '- EXTREMADAMENTE IMPORTANTE - Presta ESPECIAL ATENCIÓN a:\n' +
               '  * Números de identificación (cédulas, NIT, etc.) - DEBEN ser transcritos con 100% de precisión\n' +
               '  * Números de documentos legales y referencias\n' +
               '  * Direcciones físicas completas\n' +
               '  * Cualquier secuencia numérica o alfanumérica\n' +
               '  * FECHAS en cualquier formato (DD/MM/AAAA, texto, etc.)\n' +
               '  * Uso de mayúsculas y minúsculas en cada palabra\n\n' +
               'IGNORA COMPLETAMENTE los siguientes elementos:\n' +
               '- Firmas sobrepuestas sobre nombres o texto\n' +
               '- Sellos o timbres\n' +
               '- Números de página\n' +
               '- Membretes o encabezados institucionales\n' +
               '- Números de folio o registro\n' +
               '- Marcas de agua\n' +
               '- Firmas y sus textos asociados\n' +
               '- Cualquier anotación manuscrita sobrepuesta\n\n' +
               'Enfócate en extraer:\n' +
               '- El texto principal del documento\n' +
               '- Cláusulas y contenido sustancial\n' +
               '- Información relevante del cuerpo del documento\n' +
               '- TODOS los números de identificación y direcciones exactamente como aparecen\n' +
               '- TODAS las fechas manteniendo su formato original\n\n' +
               'REGLAS CRÍTICAS:\n' +
               '- Si hay una firma sobrepuesta sobre un nombre, IGNORA la firma y transcribe el nombre\n' +
               '- Si hay un número de identificación, asegúrate de transcribirlo DÍGITO por DÍGITO\n' +
               '- Si hay texto tachado pero legible, transcríbelo e indica que está tachado\n' +
               '- Si hay texto subrayado, transcríbelo sin indicar el subrayado\n\n' +
               'Devuelve SOLO el texto extraído, sin comentarios adicionales ni explicaciones.\n' +
               'RECUERDA: \n' +
               '- La transcripción debe ser EXACTAMENTE como aparece en el documento\n' +
               '- NO cambies NINGUNA mayúscula por minúscula o viceversa\n' +
               '- NO omitas ni modifiques NINGÚN número de identificación, dirección o fecha'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: config.openai.maxTokens
      });

      if (response.choices[0]?.message?.content) {
        console.log('Extracción de texto exitosa (OpenAI)');
        return response.choices[0].message.content.trim();
      }
      
      return '';
    } catch (error) {
      console.error('Error procesando imagen con OpenAI:', error);
      return '';
    }
  }
} 