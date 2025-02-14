# Scanned PDF to Text Extractor

Servicio de extracción de texto desde PDFs escaneados y documentos de imagen, utilizando múltiples motores de procesamiento: Ollama Vision, OpenAI Vision y Tesseract OCR. Este servicio está diseñado para manejar documentos escaneados complejos y proporcionar la máxima precisión en la extracción de texto.

[🇬🇧 English Documentation](README.md)

## Características Principales

- 🔍 **Múltiples Motores de Extracción**: Ollama Vision, OpenAI Vision y Tesseract OCR
- 📄 **Procesamiento Flexible**: Soporta PDFs escaneados e imágenes (JPG, PNG)
- 🚀 **Procesamiento en Paralelo**: Opción de procesar múltiples páginas simultáneamente
- 📑 **Selección de Páginas**: Procesa rangos específicos o páginas seleccionadas
- ⚙️ **Altamente Configurable**: Múltiples opciones de ajuste para optimizar resultados
- 🔧 **Preprocesamiento de Imágenes**: Optimización automática para mejor reconocimiento

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API](#api)
- [Modos de Procesamiento](#modos-de-procesamiento)
- [Configuración Avanzada](#configuración-avanzada)

## Requisitos

- Node.js >= 18
- Tesseract OCR
- Ollama (opcional, para modo Ollama)
- API Key de OpenAI (opcional, para modo OpenAI)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/ddarthp/scanned-pdf-to-text-extractor.git
cd scanned-pdf-to-text-extractor
```

2. Instalar dependencias:
```bash
npm install
```

3. Copiar el archivo de configuración:
```bash
cp .env.example .env
```

4. Configurar las variables de entorno en `.env`

5. Compilar el proyecto:
```bash
npm run build
```

6. Iniciar el servidor:
```bash
npm start
```

Para desarrollo:
```bash
npm run dev
```

## Configuración

### Variables de Entorno

#### Configuración del Servidor
- `PORT`: Puerto del servidor (default: 3080)

#### Configuración de Ollama
- `OLLAMA_HOST`: URL del servidor Ollama (default: http://localhost:11434)
- `OLLAMA_MODEL`: Modelo a utilizar (default: llama3.2-vision)
  - Opciones: llama3.2-vision, llava

#### Configuración de OpenAI
- `OPENAI_API_KEY`: API Key de OpenAI
- `OPENAI_MODEL`: Modelo a utilizar (default: gpt-4o-mini)
  - Opciones: gpt-4o-mini, gpt-4o
- `OPENAI_MAX_TOKENS`: Máximo de tokens por respuesta (default: 4096)

#### Configuración OCR
- `OCR_LANGUAGE`: Idioma para Tesseract OCR (default: spa)
- `OCR_PSM_MODE`: Modo de segmentación de página (default: 6 - PSM.SINGLE_BLOCK)

#### Procesamiento de PDF
- `PDF_DENSITY`: Densidad de conversión PDF a imagen (default: 300)
- `PDF_IMAGE_WIDTH`: Ancho máximo de imagen (default: 2048)
- `PDF_IMAGE_HEIGHT`: Alto máximo de imagen (default: 2048)
- `PDF_IMAGE_QUALITY`: Calidad de imagen JPEG (default: 80)

#### Carga de Archivos
- `MAX_FILE_SIZE`: Tamaño máximo de archivo en MB (default: 500)
- `UPLOAD_DIR`: Directorio para archivos temporales (default: uploads)

#### Configuración por Defecto
- `DEFAULT_MODE`: Modo de procesamiento por defecto (default: ollama)
  - Opciones: ollama, ocr, openai
- `DEFAULT_PARALLEL`: Procesamiento en paralelo (default: false)

## Uso

### API

#### Endpoint de Procesamiento

```
POST /api/process
Content-Type: multipart/form-data
```

##### Parámetros

| Parámetro | Tipo | Descripción | Valores Posibles | Default |
|-----------|------|-------------|------------------|---------|
| document | File | Archivo a procesar | PDF, JPG, PNG | - |
| mode | String | Modo de procesamiento | ollama, ocr, openai | ollama |
| model | String | Modelo específico | llama3.2-vision, llava, gpt-4o-mini, gpt-4o | Según modo |
| parallel | Boolean | Procesamiento en paralelo | true, false | false |
| page_range | String | Rango de páginas | "1-5", "2-10", etc. | Todo el documento |
| selected_pages | String | Páginas específicas | "1,3,5,7" | Todo el documento |

##### Ejemplos de Uso

1. Procesamiento básico:
```bash
curl -X POST -F "document=@documento.pdf" http://localhost:3080/api/process
```

2. Usando OCR con páginas específicas:
```bash
curl -X POST \
  -F "document=@documento.pdf" \
  -F "mode=ocr" \
  -F "selected_pages=1,3,5" \
  http://localhost:3080/api/process
```

3. Usando OpenAI con rango de páginas:
```bash
curl -X POST \
  -F "document=@documento.pdf" \
  -F "mode=openai" \
  -F "model=gpt-4o-mini" \
  -F "page_range=1-5" \
  http://localhost:3080/api/process
```

### Respuesta

```json
{
  "success": true,
  "text": "Texto extraído...",
  "isScanned": true,
  "pages": [
    {
      "page": 1,
      "text": "Texto de la página...",
      "error": null
    }
  ],
  "totalPages": 10
}
```

## Modos de Procesamiento

### Ollama Vision
- Mejor para documentos complejos
- Requiere servidor Ollama
- Modelos disponibles: llama3.2-vision, llava

### OpenAI Vision
- Alta precisión
- Requiere API Key
- Modelos disponibles: gpt-4o-mini, gpt-4o

### Tesseract OCR
- No requiere servicios externos
- Mejor para documentos simples y bien escaneados
- Procesamiento más rápido

## Configuración Avanzada

### Optimización de Imágenes

El servicio incluye preprocesamiento de imágenes para mejorar la calidad del OCR:

- Conversión a escala de grises
- Normalización de contraste
- Reducción de ruido
- Ajuste de nitidez

Estos parámetros se pueden ajustar en el código según necesidades específicas.

### Procesamiento en Paralelo

El modo paralelo procesa múltiples páginas simultáneamente, lo que puede mejorar significativamente el rendimiento en documentos grandes. Sin embargo, consume más recursos del sistema.

### Gestión de Memoria

Para documentos grandes, se recomienda:
1. Usar el parámetro `page_range` para procesar por lotes
2. Ajustar `PDF_IMAGE_WIDTH` y `PDF_IMAGE_HEIGHT` según necesidades
3. Monitorear el uso de memoria del servidor 