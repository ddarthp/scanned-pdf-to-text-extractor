FROM ubuntu:22.04

# Evitar interacciones durante la instalación de paquetes
ENV DEBIAN_FRONTEND=noninteractive

# Instalar Node.js y otras dependencias
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3 \
    libjpeg-dev \
    libcairo2-dev \
    libgif-dev \
    libpango1.0-dev \
    libtool \
    autoconf \
    automake \
    tesseract-ocr \
    tesseract-ocr-spa \
    # Sharp y PDF dependencies
    libvips-dev \
    libfftw3-dev \
    poppler-utils \
    ghostscript \
    # GraphicsMagick para conversión de PDFs
    graphicsmagick \
    # Limpieza
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g n \
    && n 23.6.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Crear usuario no root
RUN useradd -u 1000 -m appuser && \
    chown -R appuser:appuser /usr/src/app

# Crear directorio de uploads y ajustar permisos
RUN mkdir -p uploads && \
    chown -R appuser:appuser uploads && \
    chmod 777 uploads

# Copiar archivos de package
COPY --chown=appuser:appuser package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY --chown=appuser:appuser . .

# Compilar TypeScript
RUN npm run build

# Cambiar a usuario no root
USER appuser

# Exponer puerto
EXPOSE 3080

# El comando se sobreescribirá por docker-compose.yml
CMD ["npm", "run", "dev"] 