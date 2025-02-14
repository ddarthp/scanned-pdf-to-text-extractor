FROM node:18-alpine

# Install build dependencies and Tesseract
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake \
    tesseract-ocr \
    tesseract-ocr-data-spa \
    # Sharp dependencies
    vips-dev \
    fftw-dev \
    build-base \
    # PDF processing dependencies
    poppler-utils \
    ghostscript

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root user
USER node

# Expose port
EXPOSE 3080

# Start command
CMD ["npm", "start"] 