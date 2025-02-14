# Scanned PDF to Text Extractor

A powerful service for extracting text from scanned PDFs and image documents, utilizing multiple processing engines: Ollama Vision, OpenAI Vision, and Tesseract OCR. This service is designed to handle complex scanned documents and provide maximum accuracy in text extraction.

[🇪🇸 Documentación en Español](README_ES.md)

## Key Features

- 🔍 **Multiple Extraction Engines**: Ollama Vision, OpenAI Vision, and Tesseract OCR
- 📄 **Flexible Processing**: Supports scanned PDFs and images (JPG, PNG)
- 🚀 **Parallel Processing**: Option to process multiple pages simultaneously
- 📑 **Page Selection**: Process specific ranges or selected pages
- ⚙️ **Highly Configurable**: Multiple adjustment options to optimize results
- 🔧 **Image Preprocessing**: Automatic optimization for better recognition

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API](#api)
- [Processing Modes](#processing-modes)
- [Advanced Configuration](#advanced-configuration)

## Requirements

- Node.js >= 18
- Tesseract OCR
- Ollama (optional, for Ollama mode)
- OpenAI API Key (optional, for OpenAI mode)

## Installation

### Standard Installation

1. Clone the repository:
```bash
git clone https://github.com/ddarthp/scanned-pdf-to-text-extractor.git
cd scanned-pdf-to-text-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Copy the configuration file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

5. Build the project:
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

### Docker Installation

1. Clone the repository:
```bash
git clone https://github.com/ddarthp/scanned-pdf-to-text-extractor.git
cd scanned-pdf-to-text-extractor
```

2. Copy the configuration file and adjust environment variables:
```bash
cp .env.example .env
```

3. Build the Docker image:
```bash
docker build -t scanned-pdf-to-text-extractor .
```

4. Run the container:
```bash
docker run -d \
  --name pdf-extractor \
  -p 3080:3080 \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  --env-file .env \
  scanned-pdf-to-text-extractor
```

Note: For the Ollama mode, you need to have the Ollama server running separately and accessible from the container. Make sure to configure the `OLLAMA_HOST` environment variable accordingly.

## Configuration

### Environment Variables

#### Server Configuration
- `PORT`: Server port (default: 3080)

#### Ollama Configuration
- `OLLAMA_HOST`: Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL`: Model to use (default: llama3.2-vision)
  - Options: llama3.2-vision, llava

#### OpenAI Configuration
- `OPENAI_API_KEY`: OpenAI API Key
- `OPENAI_MODEL`: Model to use (default: gpt-4o-mini)
  - Options: gpt-4o-mini, gpt-4o
- `OPENAI_MAX_TOKENS`: Maximum tokens per response (default: 4096)

#### OCR Configuration
- `OCR_LANGUAGE`: Tesseract OCR language (default: spa)
- `OCR_PSM_MODE`: Page segmentation mode (default: 6 - PSM.SINGLE_BLOCK)

#### PDF Processing
- `PDF_DENSITY`: PDF to image conversion density (default: 300)
- `PDF_IMAGE_WIDTH`: Maximum image width (default: 2048)
- `PDF_IMAGE_HEIGHT`: Maximum image height (default: 2048)
- `PDF_IMAGE_QUALITY`: JPEG image quality (default: 80)

#### File Upload
- `MAX_FILE_SIZE`: Maximum file size in MB (default: 500)
- `UPLOAD_DIR`: Directory for temporary files (default: uploads)

#### Default Settings
- `DEFAULT_MODE`: Default processing mode (default: ollama)
  - Options: ollama, ocr, openai
- `DEFAULT_PARALLEL`: Parallel processing (default: false)

## Usage

### API

#### Processing Endpoint

```
POST /api/process
Content-Type: multipart/form-data
```

##### Parameters

| Parameter | Type | Description | Possible Values | Default |
|-----------|------|-------------|-----------------|---------|
| document | File | File to process | PDF, JPG, PNG | - |
| mode | String | Processing mode | ollama, ocr, openai | ollama |
| model | String | Specific model | llama3.2-vision, llava, gpt-4o-mini, gpt-4o | Mode dependent |
| parallel | Boolean | Parallel processing | true, false | false |
| page_range | String | Page range | "1-5", "2-10", etc. | Entire document |
| selected_pages | String | Specific pages | "1,3,5,7" | Entire document |

##### Usage Examples

1. Basic processing:
```bash
curl -X POST -F "document=@document.pdf" http://localhost:3080/api/process
```

2. Using OCR with specific pages:
```bash
curl -X POST \
  -F "document=@document.pdf" \
  -F "mode=ocr" \
  -F "selected_pages=1,3,5" \
  http://localhost:3080/api/process
```

3. Using OpenAI with page range:
```bash
curl -X POST \
  -F "document=@document.pdf" \
  -F "mode=openai" \
  -F "model=gpt-4o-mini" \
  -F "page_range=1-5" \
  http://localhost:3080/api/process
```

### Response

```json
{
  "success": true,
  "text": "Extracted text...",
  "isScanned": true,
  "pages": [
    {
      "page": 1,
      "text": "Page text...",
      "error": null
    }
  ],
  "totalPages": 10
}
```

## Processing Modes

### Ollama Vision
- Best for complex documents
- Requires Ollama server
- Available models: llama3.2-vision, llava

### OpenAI Vision
- High accuracy
- Requires API Key
- Available models: gpt-4o-mini, gpt-4o

### Tesseract OCR
- No external services required
- Best for simple and well-scanned documents
- Faster processing

## Advanced Configuration

### Image Optimization

The service includes image preprocessing to improve OCR quality:

- Grayscale conversion
- Contrast normalization
- Noise reduction
- Sharpness adjustment

These parameters can be adjusted in the code according to specific needs.

### Parallel Processing

Parallel mode processes multiple pages simultaneously, which can significantly improve performance on large documents. However, it consumes more system resources.

### Memory Management

For large documents, it is recommended to:
1. Use the `page_range` parameter to process in batches
2. Adjust `PDF_IMAGE_WIDTH` and `PDF_IMAGE_HEIGHT` according to needs
3. Monitor server memory usage 